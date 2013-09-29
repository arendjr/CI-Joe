"use strict";


function main() {

    var yaml = require("yaml-config");
    var config = yaml.readConfig("config/app.yaml");

    console.log("I'm the slave, shell=" + config.shell);
}

main();
