"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


/**
 * Action.
 *
 * Maintains a single action.
 */
function Action(config) {

    EventEmitter.call(this);

    /**
     * Config object containing the action's settings.
     */
    this.config = config;

    /**
     * Command to use for executing the action.
     *
     * Read-only property. Use setCommand() for setting.
     */
    this.command = config.command || "";

    /**
     * Short description of the action.
     *
     * Read-only property. Use setDescription() for setting.
     */
    this.description = config.description || "";

    /**
     * Timeout (in seconds) within which the command should complete. A value of 0 means no timeout
     * is set.
     *
     * Read-only property. Use setTimeout() for setting.
     */
    this.timeout = config.timeout || 0;
}

util.inherits(Action, EventEmitter);

_.extend(Action.prototype, {

    /**
     * Sets the name of the action.
     */
    setCommand: function(command) {

        if (this.command !== command) {
            this.command = command;
            this.config.set("command", command);

            this.emit("changed", "command", command);
        }
    },

    /**
     * Sets the description of the action.
     */
    setDescription: function(description) {

        if (this.description !== description) {
            this.description = description;
            this.config.set("description", description);

            this.emit("changed", "description", description);
        }
    },

    /**
     * Sets the timeout of the action.
     */
    setTimeout: function(timeout) {

        if (this.timeout !== timeout) {
            this.timeout = timeout;
            this.config.set("timeout", timeout);

            this.emit("changed", "timeout", timeout);
        }
    }

});


module.exports = Action;
