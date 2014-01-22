"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var fs = require("fs");
var mkpath = require("mkpath");
var Model = require("./model");


/**
 * Job.
 *
 * Maintains information about a job.
 */
module.exports = Model.extend({

    initialize: function(config, options) {

        options = options || {};
        options.isMaster = (options.isMaster !== false);

        /**
         * The name of the slave that is or was assigned to the job.
         *
         * Read-only property. Use set() for setting.
         */
        this.set("assignedSlave", config.assignedSlave || "");

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
         * Options providing context for the job. May contain the following property:
         * isMaster - Boolean indicating whether the running process belongs to the master.
         */
        this.options = options;

        /**
         * Results of executing the the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.set("results", {
            endTime: 0,
            exitCode: -1,
            output: "",
            startTime: 0
        });
        this.on("results:change", _.bind(this._persistResults, this));

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
         * Read-only property. Use set() for setting.
         */
        this.set("status", (config.status === "success" ? "success" : "failed"));
        this.on("change:status", _.bind(function(event) {
            var status = event.value;
            if (status === "success" || status === "failed") {
                this._unbindSocket();
            }
        }, this));
    },

    /**
     * Loads previously persisted results, if necessary.
     */
    loadResults: function() {

        try {
            var contents = fs.readFileSync("results/" + this.missionId + "/" + this.id);
            this.results = JSON.parse(contents);
        } catch (exception) {}
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
        socket.on("job:output", function(data) {
            if (data.jobId === self.id) {
                self._processOutput(data.output);
            }
        });
        socket.on("job:finished", function(data) {
            if (data.job.id === self.id) {
                self._finish(data.job);
            }
        });
    },

    type: "job",

    _finish: function(jobData) {

        this.set("results", jobData.results);
        this.set("status", jobData.status);
    },

    _persistResults: function() {

        try {
            if (this.options.isMaster) {
                var dirPath = "results/" + this.missionId;
                mkpath.sync(dirPath);
                fs.writeFileSync(dirPath + "/" + this.id, JSON.stringify(this.results));
            }
        } catch (exception) {
            var message = "Warning: An exception occurred while persisting job results.\n" +
                          "         When you restart the server, all results will be erased.";
            this.fire("exception", { exception: exception, message: message });
            console.log(message + "\nException: " + exception.stack);
        }
    },

    _processOutput: function(output) {

        this.results.output += output;
    },

    _unbindSocket: function() {

        if (this.socket) {
            this.socket.removeAllListeners("job:output");
            this.socket.removeAllListeners("job:finished");
            this.socket = null;
        }
    }

});
