"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
var util = require("util");
var Workspace = require("./workspace");


/**
 * Campaign.
 *
 * Maintains a single campaign and its configuration.
 */
function Campaign(config) {

    EventEmitter.call(this);

    /**
     * Config object containing the campaigns's settings.
     */
    this.config = config;

    /**
     * Campaign ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a campaign without ID");
    }

    /**
     * Name of the campaign.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name || "";

    /**
     * Array of phases to execute to complete the campaign.
     *
     * Each phase is an object containing the following properties.
     *     continueAfterFailure - Boolean whether the campaign should continue to the next phase
     *                            when a mission in this phase has failed.
     *     missions - Array of mission IDs to execute in parallel during this phase.
     *
     * Read-only property. Use setPhases() for setting.
     */
    this.phases = config.phases || [];

    /**
     * Array of runs.
     *
     * Each run is an object containing the following properties.
     *     endTime - Timestamp at which the campaign was concluded.
     *     phaseResults - Array of results from the various phases. Each phaseResult object contains
     *                    the following properties:
     *                        jobs: Array of job IDs executed during the phase.
     *     result - Either "pending", "success" or "failure".
     *     startTime - Timestamp at which the campaign was started.
     *
     * Read-only property. Use addRun() to add a run.
     */
    this.runs = config.runs || [];

    /**
     * Schedule on which to execute the campaign.
     *
     * Either null for no schedule or an object containing the following properties:
     *     days - Array of days (integers, 0 for Sunday, 6 for Saturday).
     *     hours - Array of hours (integers).
     *     minutes - Array of minutes (integers).
     *
     * When an array is empty, every day/hour/minute matches.
     *
     * Read-only property. Use setSchedule() for setting.
     */
    this.schedule = config.schedule || null;

    /**
     * Array of workspaces.
     *
     * Read-only property. Use setWorkspaces() for setting.
     */
    this.workspaces = _.map(config.workspaces, function(workspaceConfig) {
        return new Workspace(workspaceConfig);
    }, this);
}

/**
 * Generates a unique campaign ID.
 *
 * @param campaigns Array of campaigns among which the ID should be unique.
 */
Campaign.uniqueId = function(campaigns) {

    var index = 0, id = "job" + index;
    while (_.any(campaigns, { id: id })) {
        id = "job" + (++index);
    }
    return id;
};

util.inherits(Campaign, EventEmitter);

_.extend(Campaign.prototype, {

    /**
     * Adds a new pending campaign run and returns it.
     */
    addRun: function() {

        var run = new Laces.Map({
            endTime: 0,
            phaseResults: [],
            result: "pending",
            startTime: Date.now()
        });

        this.runs.push(run);
        this.config.runs.push(run);

        return run;
    },

    /**
     * Sets the name of the campaign.
     */
    setName: function(name) {

        if (this.name !== name) {
            this.name = name;
            this.config.set("name", name);

            this.emit("change", "name", name);
        }
    },

    /**
     * Sets the campaign's phases.
     */
    setPhases: function(phases) {

        if (this.phases !== phases) {
            this.phases = phases;
            this.config.set("phases", phases);

            this.emit("change", "phases", phases);
        }
    },

    /**
     * Sets the schedule on which to execute the campaign.
     */
    setSchedule: function(schedule) {

        if (this.schedule !== schedule) {
            this.schedule = schedule;
            this.config.set("schedule", schedule);

            this.emit("change", "schedule", schedule);
        }
    },

    /**
     * Sets the workspaces available for executing missions.
     */
    setWorkspaces: function(workspaces) {

        if (this.workspaces !== workspaces) {
            this.workspaces = workspaces;
            this.config.set("workspaces", workspaces);

            this.emit("change", "workspaces", workspaces);
        }
    },

    /**
     * Generates a JSON representation of the campaign for serialization.
     */
    toJSON: function() {

        return _.clone(this.config);
    }
});


module.exports = Campaign;
