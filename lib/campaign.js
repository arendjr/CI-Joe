"use strict";


var Laces = require("laces.js");
var Model = require("./model");


/**
 * Campaign.
 *
 * Maintains a single campaign and its configuration.
 */
module.exports = Model.extend({

    initialize: function(config) {

        /**
         * Name of the campaign.
         *
         * Read-only property. Use set() for setting.
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
         * Read-only property. Use set() for setting.
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
         * Read-only property. Use set() for setting.
         */
        this.schedule = config.schedule || null;

        /**
         * Properties which are serialized
         */

        /**
         * Array of workspace IDs.
         *
         * Read-only property. Use set() for setting.
         */
        this.workspaces = config.workspaces || [];
    },

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

    type: "campaign"

});
