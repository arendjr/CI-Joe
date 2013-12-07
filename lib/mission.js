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
    this.assignedSlaves = config.assignedSlaves;

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
    this.jobs = _.map(config.jobs, function(config) { return new Job(config); });

    /**
     * Name of the mission.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;

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
    },

    /**
     * Sets the actions of the mission.
     */
    setActions: function(actions) {

        if (!_.isEqual(this.config.actions, actions)) {
            this.actions = _.map(actions, function(config) { return new Action(config); });
            this.config.set("actions", actions);

            this.emit("changed", "actions", actions);
        }
    },

    /**
     * Sets the environment variables to set when executing mission.
     */
    setEnvironment: function(environment) {

        if (this.environment !== environment) {
            this.environment = environment;
            this.config.set("environment", environment);

            this.emit("changed", "environment", environment);
        }
    },

    /**
     * Sets the name of the mission.
     */
    setName: function(name) {

        if (this.name !== name) {
            this.name = name;
            this.config.set("name", name);

            this.emit("changed", "name", name);
        }
    },

    /**
     * Sets the shell to use for executing the mission.
     */
    setShell: function(shell) {

        if (this.shell !== shell) {
            this.shell = shell;
            this.config.set("shell", shell);

            this.emit("changed", "shell", shell);
        }
    },

    /**
     * Generates a JSON representation of the mission for serialization.
     */
    toJSON: function() {

        return _.extend({
            lastJobStatus: (this.jobs.length ? this.jobs[this.jobs.length - 1].status : "n/a")
        }, this.config);
    }
});


module.exports = Mission;
