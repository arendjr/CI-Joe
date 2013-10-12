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

    startMission: function(missionName) {

        var mission = _.find(this.missions, { name: missionName });
        this.jobQueue.push(mission);
    },

    _init: function() {

        this.missions = _.map(this.config.missions, function(config) {
            return new Mission(config);
        });
    }

});


module.exports = CommandPost;
