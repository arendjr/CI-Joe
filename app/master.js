"use strict";


function main() {

    var yaml = require("yaml-config");
    var config = yaml.readConfig("config/app.yaml");

    console.log("I'm the master, shell=" + config.shell);
}

main();
