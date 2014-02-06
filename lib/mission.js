"use strict";


var _ = require("lodash");
var fs = require("fs");
var Job = require("./job");
var Laces = require("laces.js");
var Model = require("./model");


/**
 * Mission.
 *
 * Maintains a single mission and its history of mission runs.
 */
module.exports = Model.extend({

    initialize: function(config, options) {

        options = options || {};
        options.isMaster = (options.isMaster !== false);

        /**
         * Array of slave IDs to which the mission is assigned. If none given, the mission may be
         * assigned to any available slave.
         */
        this.set("assignedSlaves", config.assignedSlaves || []);

        /**
         * Campaigns the mission is associated with.
         */
        this.set("campaigns", config.campaigns || []);

        /**
         * Command to use for executing the mission.
         */
        this.set("command", config.command || "");

        /**
         * Environment variables to set when executing the mission.
         */
        this.set("environment", config.environment);

        /**
         * Array of jobs.
         */
        if (options.isMaster) {
            try {
                this.jobs = _.map(fs.readdirSync("jobs/" + this.id), function(jobId) {
                    return new Job({ id: jobId }, { isMaster: true, missionId: this.id });
                }, this);
            } catch (exception) {
                this.jobs = [];
            }
        } else {
            this.jobs = _.map(config.jobs, function(jobConfig) {
                return new Job(jobConfig, { isMaster: false, missionId: this.id });
            }, this);
        }

        /**
         * Timestamp of the last failed job.
         */
        this.set("lastFailure", config.lastFailure || 0);

        /**
         * Timestamp of the last successful job.
         */
        this.set("lastSuccess", config.lastSuccess || 0);

        /**
         * Name of the mission.
         */
        this.set("name", config.name || "");

        /**
         * Options providing context for the mission. May contain the following property:
         * isMaster - Boolean indicating whether the running process belongs to the master.
         */
        this.options = options;

        /**
         * Shell to use for executing the mission.
         */
        this.set("shell", config.shell || "");

        /**
         * Whether the mission was created stand-alone or as part of a mission.
         */
        this.set("standalone", (config.standalone !== undefined ? config.standalone : true));

        /**
         * Status of the last ran job.
         *
         * One of "unavailable", "queued", "running", "success" or "failed".
         */
        this.set("status", config.status || "unavailable");

        /**
         * Timeout (in seconds) within which the command should complete.
         *
         * A value of 0 means no timeout is set.
         */
        this.set("timeout", config.timeout || 0);

        /**
         * ID of the workspace to use.
         */
        this.set("workspace", config.workspace || "");
    },

    /**
     * Adds a new queued job.
     */
    addQueuedJob: function() {

        var config = new Laces.Map({ id: Job.uniqueId(this.jobs) });
        var job = new Job(config, { missionId: this.id });
        job.set("status", "queued");
        this.jobs.push(job);

        var self = this;
        job.on("change:status", function(event) {
            var status = event.value;
            if (status === "success") {
                self.set("lastSuccess", job.results.endTime);
            } else if (status === "failed") {
                self.set("lastFailure", job.results.endTime);
            }
            self.set("status", status);
        });
        job.on("output", function(event) {
            self.fire("job:output", _.extend({ job: job }, event));
        });
        job.on("exception", function(event) { self.fire("exception", event); });
    },

    /**
     * Returns a job by ID.
     */
    getJob: function(id) {

        return _.find(this.jobs, { id: id });
    },

    /**
     * Stops the oldest queued or running job.
     */
    stopOldestActiveJob: function() {

        var activeJobs = _.filter(this.jobs, function(job) {
            return job.status === "queued" || job.status === "running";
        });
        if (activeJobs.length > 0) {
            activeJobs[0].stop();
        }
    },

    /**
     * Generates a JSON representation of the mission for serialization.
     */
    toJSON: function() {

        var json = Model.prototype.toJSON.call(this);
        json.jobs = _.map(this.jobs, function(job) { return job.toJSON(); });
        return json;
    },

    type: "mission"

});
