"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
var Mission = require("./mission");
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
     * Index of the action being executed.
     */
    this.actionIndex = -1;

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

        var mission = new Mission(missionConfig);

        this.actionIndex = -1;
        this.isBusy = true;
        this.job = mission.jobs[0];
        this.mission = mission;

        this.job.setStatus("running");

        this._executeNextAction();
    },

    _executeNextAction: function() {

        var actionIndex = ++this.actionIndex;

        var actions = this.mission.actions;
        var actionResults = this.job.actionResults;
        if (actionIndex < actions.length) {
            if (actionIndex > 0) {
                var exitCode = actionResults[actionResults.length - 1].exitCode;
                if (exitCode !== 0) {
                    this._finished();
                    return;
                }

                this.emit("action-finished", { actionIndex: actionIndex - 1, exitCode: exitCode });
            }
        } else {
            this._finished();
            return;
        }

        var action = actions[actionIndex];
        var mission = this.mission;

        var actionResult = {
            exitCode: null,
            output: "",
            startTime: (new Date()).getTime(),
            endTime: null
        };

        var shell = mission.shell.split(" ");
        var sh = spawn(shell[0], shell.slice(1), {
            cwd: "workspaces/" + mission.id,
            timeout: action.timeout * 1000
        });
        sh.stdin.write(action.command);
        sh.stdin.end();

        var self = this;
        sh.stdout.on("data", function(data) {
            if (self.job) {
                actionResult.output += data;

                self.emit("output", data);
            }
        });
        sh.stderr.on("data", function(data) {
            if (self.job) {
                data = "\x1B[31;1m" + data + "\x1B[0m";
                actionResult.output += data;

                self.emit("output", data);
            }
        });
        sh.on("close", function(exitCode) {
            if (self.job) {
                actionResult.exitCode = exitCode;
                actionResult.endTime = (new Date()).getTime();
                actionResults.push(actionResult);

                self._executeNextAction();
            }
        });
        sh.on("error", function(error) {
            actionResult.exitCode = -1;
            actionResult.endTime = (new Date()).getTime();
            actionResult.output += error.message;
            actionResults.push(actionResult);

            self._finished();
        });
    },

    _finished: function() {

        var job = this.job;
        var actionResults = job.actionResults;
        if (actionResults.length > 0 && actionResults[actionResults.length - 1].exitCode !== 0) {
            job.setStatus("failed");
        } else {
            job.setStatus("success");
        }

        this.emit("finished", { job: job, mission: this.mission });

        this.actionIndex = -1;
        this.isBusy = false;
        this.job = null;
        this.mission = null;
    }

});


module.exports = JobRunner;
