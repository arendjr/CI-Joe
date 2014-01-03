"use strict";


var _ = require("lodash");
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
     * Array of slave IDs to which the mission is assigned. If none given, the mission may be
     * assigned to any available slave.
     */
    this.assignedSlaves = config.assignedSlaves || [];

    /**
     * Command to use for executing the mission.
     *
     * Read-only property. Use setCommand() for setting.
     */
    this.command = config.command || "";

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
     * Array of jobs.
     */
    this.jobs = _.map(config.jobs, function(jobConfig) {
        return new Job(jobConfig, { missionId: this.id });
    }, this);

    /**
     * Name of the mission.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;

    /**
     * Timeout (in seconds) within which the command should complete.
     *
     * A value of 0 means no timeout is set.
     *
     * Read-only property. Use setTimeout() for setting.
     */
    this.timeout = config.timeout || 0;

    /**
     * Shell to use for executing the mission.
     *
     * Read-only property. Use setShell() for setting.
     */
    this.shell = config.shell;

    /**
     * ID of the workspace to use.
     *
     * Read-only property. Use setWorkspace() for setting.
     */
    this.workspace = config.workspace || "";
}

/**
 * Generates a unique mission ID.
 *
 * @param missions Array of missions among which the ID should be unique.
 */
Mission.uniqueId = function(missions) {

    var index = 0, id = "job" + index;
    while (_.any(missions, { id: id })) {
        id = "job" + (++index);
    }
    return id;
};

util.inherits(Mission, EventEmitter);

_.extend(Mission.prototype, {

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
     * Sets the command to execute.
     */
    setCommand: function(command) {

        if (this.command !== command) {
            this.command = command;
            this.config.set("command", command);

            this.emit("change", "command", command);
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
     * Sets the timeout of the command.
     */
    setTimeout: function(timeout) {

        if (this.timeout !== timeout) {
            this.timeout = timeout;
            this.config.set("timeout", timeout);

            this.emit("change", "timeout", timeout);
        }
    },

    /**
     * Sets the workspace of the mission.
     */
    setWorkspace: function(workspace) {

        if (this.workspace !== workspace) {
            this.workspace = workspace;
            this.config.set("workspace", workspace);

            this.emit("change", "workspace", workspace);
        }
    },

    /**
     * Generates a JSON representation of the mission for serialization.
     */
    toJSON: function() {

        return _.extend({}, this.config, {
            jobs: _.map(this.jobs, function(job) { return job.toJSON(); })
        });
    }
});


module.exports = Mission;
