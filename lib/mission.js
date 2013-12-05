"use strict";


var _ = require("lodash");
var Action = require("./action");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


/**
 * Mission.
 *
 * Maintains a single mission and its history of mission runs.
 */
function Mission(config, options) {

    options = options || {};

    EventEmitter.call(this);

    /**
     * Config object containing the mission's settings.
     */
    this.config = config;

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
     * Name of the mission.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;

    /**
     * Array of actions to execute to complete the mission.
     */
    this.actions = _.map(config.actions, function(config) { return new Action(config); });

    /**
     * Shell to use for executing the mission.
     *
     * Read-only property. Use setShell() for setting.
     */
    this.shell = config.shell;

    /**
     * Environment variables to set when executing the mission.
     *
     * Read-only property. Use setEnvironment() for setting.
     */
    this.environment = config.environment;

    /**
     * Array of slave IDs to which the mission is assigned. If none given, the mission may be
     * assigned to any available slave.
     */
    this.assignedSlaves = config.assignedSlaves;
}

util.inherits(Mission, EventEmitter);

_.extend(Mission.prototype, {

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
     * Generates a JSON representation of the mission to send through the REST API.
     */
    toJSON: function() {

        return this.config;
    }
});


module.exports = Mission;
