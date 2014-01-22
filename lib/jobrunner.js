"use strict";


var _ = require("lodash");
var chalk = require("chalk");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
var Mission = require("./mission");
var mkpath = require("mkpath");
var spawn = require("child_process").spawn;
var util = require("util");


/**
 * Job Runner.
 *
 * Requests and runs jobs.
 */
function JobRunner() {

    EventEmitter.call(this);

    /**
     * Boolean whether the runner is currently busy.
     */
    this.isBusy = false;

    /**
     * The job being currently executed.
     */
    this.job = null;

    /**
     * The mission being currently executed.
     */
    this.mission = null;
}

util.inherits(JobRunner, EventEmitter);

_.extend(JobRunner.prototype, {

    /**
     * Starts execution of a job.
     */
    startJob: function(missionConfig) {

        if (!(missionConfig instanceof Laces.Map)) {
            missionConfig = new Laces.Map(missionConfig);
        }

        var mission = new Mission(missionConfig, { isMaster: false });
        if (!mission.jobs.length) {
            throw new Error("Assigned mission did not contain any job");
        }

        this.isBusy = true;
        this.job = mission.jobs[0];
        this.mission = mission;

        this.job.set("status", "running");

        this._execute();
    },

    _execute: function() {

        var mission = this.mission;

        var results = this.job.results;
        results.startTime = Date.now();

        try {
            var path = "workspaces/" + mission.workspace;
            mkpath.sync(path);

            var shell = mission.shell.split(" ");
            var sh = spawn(shell[0], shell.slice(1), {
                cwd: path,
                timeout: mission.timeout * 1000
            });
            sh.stdin.write(mission.command);
            sh.stdin.end();

            var self = this;
            sh.stdout.on("data", function(data) {
                if (self.job) {
                    data = "" + data;
                    results.output += data;

                    self.emit("output", data);
                }
            });
            sh.stdout.on("error", function(error) {
                if (self.job) {
                    results.output += chalk.red("Error: " + error.message);
                }
            });
            sh.stderr.on("data", function(data) {
                if (self.job) {
                    data = chalk.red(data);
                    results.output += data;

                    self.emit("output", data);
                }
            });
            sh.stderr.on("error", function(error) {
                if (self.job) {
                    results.output += chalk.red("Error: " + error.message);
                }
            });
            sh.on("close", function(exitCode) {
                if (self.job) {
                    results.exitCode = exitCode;
                    self._finished();
                }
            });
            sh.on("error", function(error) {
                results.output += chalk.red("Error: " + error.message);
                self._finished();
            });
        } catch (exception) {
            results.output += chalk.red("Exception: " + exception);
            this._finished();
        }
    },

    _finished: function() {

        var job = this.job;
        job.results.endTime = Date.now();

        if (job.results.exitCode === 0) {
            job.set("status", "success");
        } else {
            job.set("status", "failed");
        }

        this.emit("finished", { job: job, mission: this.mission });

        this.isBusy = false;
        this.job = null;
        this.mission = null;
    }

});


module.exports = JobRunner;
