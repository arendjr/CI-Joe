"use strict";


var _ = require("lodash");


function main() {

    var yaml = require("yaml-config");
    var config = yaml.readConfig("config/app.yaml");

    var argv = require("optimist")
               .usage("Usage: $0 --name=<slave-name> [--host=<server-host> --port=<server-port>]")
               .demand(["name"])
               .argv;

    var slaveName = argv.name;
    var slaveConfig = _.find(config.slaves, { name: slaveName });
    if (!slaveConfig) {
        console.log("No such slave \"" + slaveName + "\". Exit.");
        process.exit(1);
    }

    var masterConfig = _.clone(config.server);
    if (argv.host && argv.port) {
        masterConfig.hostname = argv.host;
        masterConfig.port = argv.port;
    }

    var Slave = require("../lib/slave");
    var slave = new Slave(slaveConfig, { masterConfig: masterConfig });
    slave.connect();
}

main();
