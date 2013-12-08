"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
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
     * The mission being currently executed.
     */
    this.currentMission = null;

    /**
     * Boolean whether the runner is currently busy.
     */
    this.isBusy = false;

    /**
     * ID of the job currently being executed.
     */
    this.jobId = "";
}

util.inherits(JobRunner, EventEmitter);

_.extend(JobRunner.prototype, {

    /**
     * Starts execution of a job.
     */
    startJob: function(missionConfig) {

        var mission = new Mission(missionConfig);

        this.actionIndex = -1;
        this.currentMission = mission;

        this._executeNextAction();
    },

    _executeNextAction: function() {

        var actionIndex = ++this.actionIndex;

        var actions = this.currentMission.actions;
        if (actionIndex >= actions.length) {
            this.actionIndex = -1;
            this.emit("finished");
        } else {
            var action = actions[actionIndex];
            var mission = this.currentMission;

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
                actionResult.output += data;

                self.emit("output", data);
            });
            sh.stderr.on("data", function(data) {
                data = "\x1B[31;1m" + data + "\x1B[0m";
                actionResult.output += data;

                self.emit("output", data);
            });
            sh.on("close", function(exitCode) {
                actionResult.exitCode = exitCode;
                actionResult.endTime = (new Date()).getTime();

                self._executeNextAction();
            });
        }
    }

});


module.exports = JobRunner;
