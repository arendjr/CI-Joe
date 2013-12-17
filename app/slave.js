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

    var JobRunner = require("../lib/jobrunner");
    var jobRunner = new JobRunner();

    var socket = slave.socket;
    socket.on("queue:job-available", function() {
        if (!jobRunner.isBusy) {
            socket.emit("queue:request-job");
        }
    });

    socket.on("job:start", function(data) {
        jobRunner.startJob(data.mission);
    });

    socket.on("slave:rejected", function() {
        process.exit(2);
    });

    jobRunner.on("output", function(data) {
        socket.emit("job:output", {
            actionIndex: jobRunner.actionIndex,
            data: data,
            jobId: jobRunner.job.id,
            missionId: jobRunner.mission.id
        });
    });
    jobRunner.on("action-finished", function(data) {
        socket.emit("job:action-finished", {
            actionIndex: data.actionIndex,
            exitCode: data.exitCode,
            jobId: jobRunner.job.id,
            missionId: jobRunner.mission.id
        });
    });
    jobRunner.on("finished", function(data) {
        socket.emit("job:finished", { job: data.job, missionId: data.mission.id });
        socket.emit("queue:request-job");
    });
}

main();
