"use strict";


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

        /**
         * The name of the slave that is or was assigned to the job.
         *
         * Read-only property. Use set() for setting.
         */
        this.assignedSlave = config.assignedSlave || "";

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
         * Results of executing the the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.results = {
            endTime: 0,
            exitCode: -1,
            output: "",
            startTime: 0
        };

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
        this.status = (config.status === "success" ? "success" : "failed");
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
     * Sets the results.
     */
    setResults: function(results) {

        this.results = results;

        this._persistResults();

        this.emit("change", "actionResults", results);
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

    /**
     * Sets the job status.
     */
    setStatus: function(status) {

        this.status = status;
        this.config.set("status", status);

        if (status === "success" || status === "failed") {
            this._unbindSocket();
        }

        this.emit("change", "status", status);
    },

    type: "job",

    _finish: function(jobData) {

        this.setResults(jobData.results);
        this.setStatus(jobData.status);
    },

    _persistResults: function() {

        try {
            var dirPath = "results/" + this.missionId;
            mkpath.sync(dirPath);
            fs.writeFileSync(dirPath + "/" + this.id, JSON.stringify(this.results));
        } catch (exception) {
            var message = "Warning: An exception occurred while persisting job results.\n" +
                          "         When you restart the server, all results will be erased.";
            this.emit("exception", exception, message);
            console.log(message + "\nException: " + exception.stack);
        }
    },

    _processOutput: function(output) {

        this.results.output += output;

        this._persistResults();

        this.emit("change", "results", this.results);
    },

    _unbindSocket: function() {

        if (this.socket) {
            this.socket.removeAllListeners("job:output");
            this.socket.removeAllListeners("job:finished");
            this.socket = null;
        }
    }

});
