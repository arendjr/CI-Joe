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
        options.isMaster = (options.isMaster !== false);

        /**
         * The name of the slave that is or was assigned to the job.
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
         */
        this.set("results", config.results || {
            endTime: 0,
            exitCode: -1,
            output: "",
            startTime: 0
        });

        /**
         * Socket of the slave executing the job. Only relevant if used from the master.
         *
         * Read-only property. Use setSocket() for setting.
         */
        this.socket = null;

        /**
         * Job status.
         *
         * Possible values: "unavailable", "queued", "running", "success", "failed".
         */
        this.set("status", config.status || "unavailable");
    },

    /**
     * Loads previously persisted results, if necessary.
     */
    loadResults: function() {

        if (this.status === "unavailable") {
            try {
                var contents = fs.readFileSync("jobs/" + this.missionId + "/" + this.id);
                var config = JSON.parse(contents);
                this.set(config);

                if (this.status !== "success") {
                    this.status = "failed";
                }
            } catch (exception) {}
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
     * Stops the job.
     */
    stop: function() {

        if (this.socket) {
            this.socket.emit("job:stop", { jobId: this.id });
        }

        this.set("status", "failed");

        this._persistResults();

        this._unbindSocket();
    },

    type: "job",

    _finish: function(jobData) {

        this.set("results", jobData.results);
        this.set("status", jobData.status);

        this._persistResults();

        this._unbindSocket();
    },

    _persistResults: function() {

        try {
            var dirPath = "jobs/" + this.missionId;
            mkpath.sync(dirPath);
            fs.writeFileSync(dirPath + "/" + this.id, JSON.stringify(this.config));
        } catch (exception) {
            var message = "Warning: An exception occurred while persisting job results.\n" +
                          "         When you restart the server, all results will be erased.";
            this.fire("exception", { exception: exception, message: message });
            console.log(message + "\nException: " + exception.stack);
        }
    },

    _processOutput: function(output) {

        this.results.output += output;

        this._persistResults();
    },

    _unbindSocket: function() {

        if (this.socket) {
            this.socket.removeAllListeners("job:output");
            this.socket.removeAllListeners("job:finished");
            this.socket = null;
        }
    }

});
