"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Mission = require("./mission");
var util = require("util");


/**
 * Command Post.
 *
 * Keeps track of all missions, and dispatches them to slaves.
 */
function CommandPost(config, slaveDriver) {

    EventEmitter.call(this);

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array with all the missions.
     */
    this.missions = [];

    /**
     * Slave Driver instance.
     */
    this.slaveDriver = slaveDriver;

    /**
     * Array of jobs waiting to be executed.
     */
    this.jobQueue = [];

    this._init();
}

util.inherits(CommandPost, EventEmitter);

_.extend(CommandPost.prototype, {

    addMission: function(missionData) {

        var index = 0, id = "mission" + index;
        while (_.any(this.missions, { id: id })) {
            id = "mission" + (++index);
        }

        missionData.id = id;

        var mission = new Mission(missionData);

        if (!this.config.missions) {
            this.config.set("missions", []);
        }

        this.config.missions.push(missionData);
        this.missions.push(mission);

        return id;
    },

    startMission: function(missionId) {

        var mission = _.find(this.missions, { id: missionId });
        this.jobQueue.push(mission);
    },

    _init: function() {

        this.missions = _.map(this.config.missions, function(config) {
            return new Mission(config);
        });
    }

});


module.exports = CommandPost;
