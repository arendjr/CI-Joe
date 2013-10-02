"use strict";


var _ = require("lodash");


function main() {

    var yaml = require("yaml-config");
    var Laces = require("laces.js");
    var config = new Laces.Model(yaml.readConfig("config/app.yaml", "active"));
    config.bind("change", function() {
        yaml.updateConfig(_.cloneDeep(config), "config/app.yaml", "active");
    });

    var express = require("express");
    var app = express();
    var server = require("http").createServer(app);
    var io = require("socket.io").listen(server);

    app.get("/", function(req, res){
        res.sendfile("www/build/index.html");
    });

    app.use(express.static("www"));

    io.sockets.on("connection", function(socket) {
        socket.on("client", function(data) {
            console.log(data);
        });

        socket.on("slave", function(data) {
            console.log(data);
        });
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

    server.listen(config.server.port);
}

main();
