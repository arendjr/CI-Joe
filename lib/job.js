"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var fs = require("fs");
var mkpath = require("mkpath");
var util = require("util");


/**
 * Job.
 *
 * Maintains information about a job.
 */
function Job(config, options) {

    options = options || {};

    EventEmitter.call(this);

    /**
     * Results of executing the individual actions of the mission.
     *
     * Every result object contains "exitCode", "output", "startTime" and "endTime" properties.
     */
    this.actionResults = [];

    /**
     * The name of the slave that is or was assigned to the job.
     */
    this.assignedSlave = config.assignedSlave || "";

    /**
     * Config object containing the job's settings and status.
     */
    this.config = config;

    /**
     * Job ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a job without ID");
    }

    /**
     * Mission ID.
     *
     * Read-only property.
     */
    this.missionId = options.missionId;
    if (!this.missionId) {
        throw Errors.serverError("Cannot instantiate a job without mission ID");
    }

    /**
     * Socket of the slave executing the job. Only relevant if used from the master.
     *
     * Read-only property. Use setSocket() for setting.
     */
    this.socket = null;

    /**
     * Job status.
     *
     * Possible values: "queued", "running", "success", "failed".
     *
     * Read-only property. Use setStatus() for setting.
     */
    this.status = (config.status === "success" ? "success" : "failed");
}

util.inherits(Job, EventEmitter);

_.extend(Job.prototype, {

    /**
     * Loads previously persisted action results, if necessary.
     */
    loadActionResults: function() {

        try {
            var contents = fs.readFileSync("action-results/" + this.missionId + "/" + this.id);
            this.actionResults = JSON.parse(contents);
        } catch (exception) {}
    },

    /**
     * Sets the action results.
     */
    setActionResults: function(actionResults) {

        if (this.actionResults !== actionResults) {
            this.actionResults = actionResults;

            this._persistActionResults();

            this.emit("change", "actionResults", actionResults);
        }
    },

    /**
     * Sets the assigned slave.
     */
    setAssignedSlave: function(assignedSlave) {

        if (this.assignedSlave !== assignedSlave) {
            this.assignedSlave = assignedSlave;
            this.config.set("assignedSlave", assignedSlave);

            this.emit("change", "assignedSlave", assignedSlave);
        }
    },

    /**
     * Sets the socket of the slave assigned to the job.
     *
     * This will attach event handlers so output reported by the slave is represented in the job.
     */
    setSocket: function(socket) {

        this._unbindSocket();

        this.socket = socket;

        var self = this;
        socket.on("job:action-finished", function(data) {
            if (data.jobId === self.id) {
                self._finishAction(data.actionIndex, data.exitCode);
            }
        });
        socket.on("job:output", function(data) {
            if (data.jobId === self.id) {
                self._processOutput(data.actionIndex, data.data);
            }
        });
        socket.on("job:finished", function(data) {
            if (data.job.id === self.id) {
                self._finish(data.job);
            }
        });
    },

    /**
     * Sets the job status.
     */
    setStatus: function(status) {

        if (this.status !== status) {
            this.status = status;
            this.config.set("status", status);

            if (status === "success" || status === "failed") {
                this._unbindSocket();
            }

            this.emit("change", "status", status);
        }
    },

    /**
     * Generates a JSON representation of the job for serialization.
     */
    toJSON: function() {

        return _.clone(this.config);
    },

    _finish: function(jobData) {

        this.setActionResults(jobData.actionResults);
        this.setStatus(jobData.status);
    },

    _finishAction: function(actionIndex, exitCode) {

        this._reserveActionResults(actionIndex);

        var now = Date.now();
        var actionResult = this.actionResults[actionIndex];
        actionResult.exitCode = exitCode;
        actionResult.endTime = now;

        this._persistActionResults();

        this.emit("change", "actionResults", this.actionResults);
    },

    _persistActionResults: function() {

        try {
            var dirPath = "action-results/" + this.missionId;
            mkpath.sync(dirPath);
            fs.writeFileSync(dirPath + "/" + this.id, JSON.stringify(this.actionResults));
        } catch (exception) {
            var message = "Warning: An exception occurred while persisting job results.\n" +
                          "         When you restart the server, all results will be erased.";
            this.emit("exception", exception, message);
            console.log(message + "\nException: " + exception.stack);
        }
    },

    _processOutput: function(actionIndex, output) {

        this._reserveActionResults(actionIndex);

        var actionResult = this.actionResults[actionIndex];
        actionResult.output += output;

        this._persistActionResults();

        this.emit("change", "actionResults", this.actionResults);
    },

    _reserveActionResults: function(actionIndex) {

        var now = Date.now();
        while (this.actionResults.length <= actionIndex) {
            this.actionResults.push({ exitCode: -1, output: "", startTime: now, endTime: 0 });
        }
    },

    _unbindSocket: function() {

        if (this.socket) {
            this.socket.removeAllListeners("job:action-finished");
            this.socket.removeAllListeners("job:output");
            this.socket.removeAllListeners("job:finished");
            this.socket = null;
        }
    }
});


module.exports = Job;
