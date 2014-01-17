"use strict";


var _ = require("lodash");
var Job = require("./job");
var Laces = require("laces.js");
var Model = require("./model");


/**
 * Mission.
 *
 * Maintains a single mission and its history of mission runs.
 */
module.exports = Model.extend({

    initialize: function(config) {

        /**
         * Array of slave IDs to which the mission is assigned. If none given, the mission may be
         * assigned to any available slave.
         */
        this.assignedSlaves = config.assignedSlaves || [];

        /**
         * Campaigns the mission is associated with.
         *
         * Read-only property. Use set() for setting.
         */
        this.campaigns = config.campaigns || [];

        /**
         * Command to use for executing the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.command = config.command || "";

        /**
         * Environment variables to set when executing the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.environment = config.environment;

        /**
         * Array of jobs.
         */
        this.jobs = _.map(config.jobs, function(jobConfig) {
            return new Job(jobConfig, { missionId: this.id });
        }, this);

        /**
         * Name of the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.name = config.name;

        /**
         * Shell to use for executing the mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.shell = config.shell;

        /**
         * Whether the mission was created stand-alone or as part of a mission.
         *
         * Read-only property. Use set() for setting.
         */
        this.standalone = config.standalone || true;

        /**
         * Timeout (in seconds) within which the command should complete.
         *
         * A value of 0 means no timeout is set.
         *
         * Read-only property. Use set() for setting.
         */
        this.timeout = config.timeout || 0;

        /**
         * ID of the workspace to use.
         *
         * Read-only property. Use set() for setting.
         */
        this.workspace = config.workspace || "";
    },

    /**
     * Adds a new queued job.
     */
    addQueuedJob: function() {

        var config = new Laces.Map({ id: Job.uniqueId(this.jobs) });
        var job = new Job(config, { missionId: this.id });
        job.setStatus("queued");
        this.jobs.push(job);

        if (!this.config.jobs) {
            this.config.set("jobs", []);
        }
        this.config.jobs.push(config);

        this.emit("change", "jobs", this.jobs);

        var self = this;
        job.on("change", function(key) {
            if (key === "results") {
                self.emit("update:results", job);
            } else {
                self.emit("change", "jobs", self.jobs);
            }
        });
        job.on("exception", function(exception, message) {
            self.emit("exception", exception, message);
        });
    },

    /**
     * Returns a job by ID.
     */
    getJob: function(id) {

        return _.find(this.jobs, { id: id });
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
