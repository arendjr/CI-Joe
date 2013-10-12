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
     * Action ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw new Error("Cannot instantiate an action without ID");
    }

    /**
     * Command to use for executing the action.
     *
     * Read-only property. Use setCommand() for setting.
     */
    this.command = config.command || "";

    /**
     * Timeout (in seconds) within which the command should complete. A value of 0 means no timeout
     * is set.
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
            this.config.command = command;

            this.emit("changed", "command", command);
        }
    }

});


module.exports = Action;
