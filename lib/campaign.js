"use strict";


var Laces = require("laces.js");
var _ = require("lodash");
var Model = require("./model");


/**
 * Campaign.
 *
 * Maintains a single campaign and its configuration.
 */
module.exports = Model.extend({

    initialize: function(config) {

        /**
         * Command Post reference.
         *
         * Set by the Command Post itself.
         */
        this.commandPost = null;

        /**
         * Index of the phase currently being executed.
         */
        this.currentPhaseIndex = -1;

        /**
         * Timestamp of the last failed run.
         */
        this.set("lastFailure", config.lastFailure || 0);

        /**
         * Timestamp of the last successful run.
         */
        this.set("lastSuccess", config.lastSuccess || 0);

        /**
         * Name of the campaign.
         */
        this.set("name", config.name || "");

        /**
         * Array of phases to execute to complete the campaign.
         *
         * Each phase is an object containing the following properties:
         *     continueAfterFailure - Boolean whether the campaign should continue to the next phase
         *                            when a mission in this phase has failed.
         *     missions - Array of mission IDs to execute in parallel during this phase.
         */
        this.set("phases", config.phases || []);

        this.set("prerequisites", config.prerequisites || []);

        /**
         * Array of campaign IDs whose successful completion will trigger execution of this
         * campaign.
         *
         * Note the campaign will only be executed when all prerequisites' last builds were
         * successful.
         */
        this.set("prerequisites", config.schedule || []);

        /**
         * Array of runs.
         *
         * Each run is an object containing the following properties:
         *     endTime - Timestamp at which the campaign was concluded.
         *     phaseResults - Array of results from the various phases. Each phaseResult object
         *                    contains the following properties:
         *                        jobs: Array of job IDs executed during the phase.
         *     result - Either "pending", "success" or "failure".
         *     startTime - Timestamp at which the campaign was started.
         */
        this.set("runs", config.runs || []);

        /**
         * Schedule on which to execute the campaign.
         *
         * Either null for no schedule or an object containing the following properties:
         *     days - Array of days (integers, 0 for Sunday, 6 for Saturday).
         *     hours - Array of hours (integers).
         *     minutes - Array of minutes (integers).
         *
         * When an array is empty, every day/hour/minute matches.
         */
        this.set("schedule", config.schedule || null);

        /**
         * Status of the last ran job.
         *
         * One of "unavailable", "active", "success" or "failed".
         */
        this.set("status", config.status || "unavailable");

        /**
         * Array of workspace IDs.
         */
        this.set("workspaces", config.workspaces || []);
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

    /**
     * Returns the IDs of all missions in all phases of the campaign.
     */
    getMissionIds: function() {

        return _.uniq(_.flatten(_.pluck(this.phases, "missions")));
    },

    /**
     * Informs the campaign a mission has been completed.
     */
    missionCompleted: function(mission) {

        var phase = this.phases[this.currentPhaseIndex];
        var allCompleted = _.all(phase.missions, function(missionId) {
            var mission = this.commandPost.missions.get(missionId);
            return mission.status === "success" || mission.status === "failed";
        }, this);
        if (allCompleted) {
            var shouldContinue = true;
            if (!phase.continueAfterFailure) {
                var anyFailed = _.any(phase.missions, function(missionId) {
                    return this.commandPost.missions.get(missionId).status === "failed";
                }, this);
                if (anyFailed) {
                    shouldContinue = false;
                }
            }

            if (shouldContinue) {
                this.startNextPhase();
            } else {
                this.currentPhaseIndex = -1;
                this.set("lastFailure", mission.lastFailure);
                this.set("status", "failed");
            }
        }
    },

    /**
     * Starts the next phase in executing the campaign.
     *
     * If the mission was not yet active, it becomes active now (assuming there are phases to
     * execute).
     */
    startNextPhase: function() {

        var phaseIndex = this.currentPhaseIndex + 1;

        if (phaseIndex < this.phases.length) {
            var phase = this.phases[phaseIndex];
            _.each(phase.missions, function(missionId) {
                this.commandPost.startMission(missionId);
            }, this);
            this.set("status", "active");
        } else {
            phaseIndex = -1;
            this.set("lastSuccess", Date.now());
            this.set("status", "success");
        }

        this.currentPhaseIndex = phaseIndex;
    },

    /**
     * Stops executing the campaign.
     */
    stop: function() {

        if (this.status === "active") {
            var phase = this.phases[this.currentPhaseIndex];
            if (phase) {
                _.each(phase.missions, function(missionId) {
                    this.commandPost.stopMission(missionId);
                }, this);
            }

            this.set("lastFailure", Date.now());
            this.set("status", "failed");
            this.currentPhaseIndex = -1;
        }
    },

    type: "campaign"

});
