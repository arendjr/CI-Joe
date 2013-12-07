"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


/**
 * Job.
 *
 * Maintains information about a job.
 */
function Job(config) {

    EventEmitter.call(this);

    /**
     * Results of executing the individual actions of the mission.
     *
     * Every result object contains "exitCode", "output", "startTime" and "endTime" properties.
     */
    this.actionResults = [];

    /**
     * The slave that is or was assigned to the job.
     */
    this.assignedSlave = config.assignedSlave || "";

    /**
     * Config object containing the job's settings and status.
     */
    this.config = config;

    /**
     * Job ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a job without ID");
    }

    /**
     * Job status.
     *
     * Possible values: "queued", "running", "success", "failed".
     *
     * Read-only property. Use setStatus() for setting.
     */
    this.status = (config.status === "success" ? "success" : "failed");
}

util.inherits(Job, EventEmitter);

_.extend(Job.prototype, {

    /**
     * Sets the assigned slave.
     */
    setAssignedSlave: function(assignedSlave) {

        if (this.assignedSlave !== assignedSlave) {
            this.assignedSlave = assignedSlave;
            this.config.set("assignedSlave", assignedSlave);

            this.emit("changed", "assignedSlave", assignedSlave);
        }
    },

    /**
     * Sets the job status.
     */
    setStatus: function(status) {

        if (this.status !== status) {
            this.status = status;
            this.config.set("status", status);

            this.emit("changed", "status", status);
        }
    },

    /**
     * Generates a JSON representation of the job for serialization.
     */
    toJSON: function() {

        return this.config;
    }
});


module.exports = Job;
