"use strict";


var _ = require("lodash");


function main() {

    var yaml = require("yaml-config");
    var Laces = require("laces.js");
    var config = new Laces.Model(yaml.readConfig("config/app.yaml", "active"));
    if (config.server.scheme !== "http" && config.server.scheme !== "https") {
        console.log("Server scheme should be 'http' or 'https'.");
        process.exit(1);
    }
    if (!config.server.hostname || !config.server.port) {
        console.log("Server hostname or port not set.");
        process.exit(1);
    }

    config.bind("change", function() {
        yaml.updateConfig(_.cloneDeep(config), "config/app.yaml", "active");
    });

    var express = require("express");
    var app = express();
    var server = require(config.server.scheme).createServer(app);
    var io = require("socket.io").listen(server);

    app.use(express.bodyParser());

    app.get(/^\/build(?:\/[a-z0-9/]*)?$/, function(req, res) {
        var fs = require("fs");
        var index = fs.readFileSync("www/build/index.html").toString();
        index = index.replace(/\/\*defaults_start\*\/.*\/\*defaults_end\*\//,
                              JSON.stringify(config.defaults));
        res.send(index);
    });

    app.use(express.static("www"));

    var ClientPool = require("../lib/clientpool");
    var clientPool = new ClientPool();

    var SlaveDriver = require("../lib/slavedriver");
    var slaveDriver = new SlaveDriver(config, clientPool);
    _.each(slaveDriver.slaves, function(slave) {
        slave.connect();
        slave.on("change", function(/*propertyName, value*/) {
            // #TODO: notify all clients
            // #TODO: notify the respective slave
        });
    });

    var CommandPost = require("../lib/commandpost");
    var commandPost = new CommandPost(config, slaveDriver, clientPool);

    io.set("log level", 1);
    io.sockets.on("connection", function(socket) {
        socket.on("client", function(/*data*/) {
            clientPool.addClientBySocket(socket);
        });

        socket.on("slave", function(data) {
            var slave = slaveDriver.getSlaveByName(data.name);
            if (slave) {
                if (slave.socket) {
                    socket.emit("slave:rejected");

                    console.log("Duplicate slave '" + data.name + "' rejected.");
                } else {
                    slave.assignSocket(socket);

                    console.log("Slave '" + data.name + "' connected.");
                }
            }
        });

        socket.on("queue:request-job", function() {
            var slave = slaveDriver.getSlaveBySocket(socket);
            if (slave) {
                commandPost.dispatchJobToSlave(slave);
            }
        });

        socket.on("job:finished", function(data) {
            commandPost.updateJob(data.missionId, data.job);
        });
    });

    var ApiController = require("../lib/apicontroller");
    var apiController = new ApiController(commandPost, slaveDriver);
    apiController.attachTo(app);

    app.use(function(err, req, res, next) {
        /*jshint unused:false */
        console.error(err.stack);
        res.send(500, "Internal Server Error");
    });

    server.listen(config.server.port);

    function terminate() {
        slaveDriver.destruct();
        server.close();
        console.log("Quit.");
        process.exit();
    }

    process.on("SIGINT", terminate);
    process.on("SIGTERM", terminate);
}

main();
