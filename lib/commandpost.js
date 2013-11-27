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
function CommandPost(config, slaveDriver, clientPool) {

    EventEmitter.call(this);

    /**
     * Client Pool instance.
     */
    this.clients = clientPool;

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

        var missionConfig = {
            id: id,
            name: missionData.name
        };

        var mission = new Mission(missionConfig);

        if (!this.config.missions) {
            this.config.set("missions", []);
        }

        this.config.missions.push(missionConfig);
        this.missions.push(mission);

        this.clients.notifyAll("missions:add", { mission: missionConfig });

        return id;
    },

    removeMission: function(id) {

        var index = _.findIndex(this.config.missions, { id: id });
        if (index > -1) {
            this.config.missions.remove(index);

            this.missions = _.reject(this.missions, { id: id });

            this.clients.notifyAll("missions:remove", { id: id });

            return true;
        } else {
            return false;
        }
    },

    startMission: function(missionId) {

        var mission = _.find(this.missions, { id: missionId });
        this.jobQueue.push(mission);
    },

    updateMission: function(missionData) {

        var mission = _.find(this.missions, { id: missionData.id });
        if (mission) {
            mission.setName(missionData.name);

            this.clients.notifyAll("missions:update", { mission: mission.config });

            return true;
        } else {
            return false;
        }
    },

    _init: function() {

        this.missions = _.map(this.config.missions, function(config) {
            return new Mission(config);
        });
    }

});


module.exports = CommandPost;
