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
    app.use(express.static("www"));

    app.get("/", function(req, res) {
        res.sendfile("www/build/index.html");
    });

    var SlaveDriver = require("../lib/slavedriver");
    var slaveDriver = new SlaveDriver(config);
    _.each(slaveDriver.slaves, function(slave) {
        slave.connect();
        slave.on("changed", function(/*propertyName, value*/) {
            // #TODO: notify all clients
            // #TODO: notify the respective slave
        });
    });

    var ClientPool = require("../lib/clientpool");
    var clientPool = new ClientPool();

    io.set("log level", 1);
    io.sockets.on("connection", function(socket) {
        socket.on("client", function(/*data*/) {
            clientPool.addClientBySocket(socket);
        });

        socket.on("slave", function(data) {
            var slaveName = data.name;
            _.each(slaveDriver.slaves, function(slave) {
                if (slave.name === slaveName) {
                    slave.assignSocket(socket);

                    console.log("Slave '" + slaveName + "' connected.");
                }
            });
        });
    });

    var CommandPost = require("../lib/commandpost");
    var commandPost = new CommandPost(config, slaveDriver);

    var ApiController = require("../lib/apicontroller");
    var apiController = new ApiController(commandPost);
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
        process.exit();
    }

    process.on("SIGINT", terminate);
    process.on("SIGTERM", terminate);
}

main();
