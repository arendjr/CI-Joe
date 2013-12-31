"use strict";


var _ = require("lodash");
var Action = require("./action");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var Job = require("./job");
var Laces = require("laces.js");
var util = require("util");


/**
 * Mission.
 *
 * Maintains a single mission and its history of mission runs.
 */
function Mission(config) {

    EventEmitter.call(this);

    /**
     * Array of actions to execute to complete the mission.
     */
    this.actions = _.map(config.actions, function(config) { return new Action(config); });

    /**
     * Array of slave IDs to which the mission is assigned. If none given, the mission may be
     * assigned to any available slave.
     */
    this.assignedSlaves = config.assignedSlaves || [];

    /**
     * Config object containing the mission's settings.
     */
    this.config = config;

    /**
     * Environment variables to set when executing the mission.
     *
     * Read-only property. Use setEnvironment() for setting.
     */
    this.environment = config.environment;

    /**
     * Mission ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a mission without ID");
    }

    /**
     * Array of actions to execute to complete the mission.
     */
    this.jobs = _.map(config.jobs, function(jobConfig) { return new Job(jobConfig); });

    /**
     * Name of the mission.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;

    /**
     * Schedule on which to execute the mission.
     *
     * May be an object containing days, hours and minutes properties. Each of which are an array
     * of numerical values used for matching the day and time. When an array is empty, every
     * day/hour/minute matches.
     *
     * Read-only property. Use setSchedule() for setting.
     */
    this.schedule = config.schedule || null;

    /**
     * Shell to use for executing the mission.
     *
     * Read-only property. Use setShell() for setting.
     */
    this.shell = config.shell;
}

util.inherits(Mission, EventEmitter);

_.extend(Mission.prototype, {

    /**
     * Adds a new queued job.
     */
    addQueuedJob: function() {

        var index = 0, id = "job" + index;
        while (_.any(this.jobs, { id: id })) {
            id = "job" + (++index);
        }

        var config = new Laces.Map({ id: id });
        var job = new Job(config);
        job.setStatus("queued");
        this.jobs.push(job);

        if (!this.config.jobs) {
            this.config.set("jobs", []);
        }
        this.config.jobs.push(config);

        this.emit("change", "jobs", this.jobs);

        var self = this;
        job.on("change", function() {
            self.emit("change", "jobs", self.jobs);
        });
    },

    /**
     * Returns a job by ID.
     */
    getJob: function(id) {

        return _.find(this.jobs, { id: id });
    },

    /**
     * Sets the actions of the mission.
     */
    setActions: function(actions) {

        if (!_.isEqual(this.config.actions, actions)) {
            this.actions = _.map(actions, function(config) { return new Action(config); });
            this.config.set("actions", actions);

            this.emit("change", "actions", actions);
        }
    },

    /**
     * Sets the environment variables to set when executing mission.
     */
    setEnvironment: function(environment) {

        if (this.environment !== environment) {
            this.environment = environment;
            this.config.set("environment", environment);

            this.emit("change", "environment", environment);
        }
    },

    /**
     * Sets the name of the mission.
     */
    setName: function(name) {

        if (this.name !== name) {
            this.name = name;
            this.config.set("name", name);

            this.emit("change", "name", name);
        }
    },

    /**
     * Sets the schedule on which to execute the mission.
     */
    setSchedule: function(schedule) {

        if (this.schedule !== schedule) {
            this.schedule = schedule;
            this.config.set("schedule", schedule);

            this.emit("change", "schedule", schedule);
        }
    },

    /**
     * Sets the shell to use for executing the mission.
     */
    setShell: function(shell) {

        if (this.shell !== shell) {
            this.shell = shell;
            this.config.set("shell", shell);

            this.emit("change", "shell", shell);
        }
    },

    /**
     * Generates a JSON representation of the mission for serialization.
     */
    toJSON: function() {

        return _.extend({}, this.config, {
            jobs: _.map(this.jobs, function(job) { return job.toJSON(); }),
            lastJobStatus: (this.jobs.length ? this.jobs[this.jobs.length - 1].status : "n/a")
        });
    }
});


module.exports = Mission;
