"use strict";


function main() {

    var yaml = require("yaml-config");
    var config = yaml.readConfig("config/app.yaml");

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

    server.listen(config.server.port);
}

main();
