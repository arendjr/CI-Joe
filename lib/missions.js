"use strict";


var _ = require("lodash");
var Mission = require("./mission");
var Errors = require("./errors");
var Laces = require("laces.js");


/**
 * Missions.
 *
 * Container for all missions.
 */
function Missions(config) {

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array of missions.
     */
    this.models = [];

    this._init();
}

_.extend(Missions.prototype, {

    /**
     * Adds a mission.
     */
    add: function(missionData) {

        var missionConfig = new Laces.Map({
            id: Mission.uniqueId(this.missions)
        });
        _.each(missionData, function(value, propertyName) {
            missionConfig.set(propertyName, value);
        });

        var mission = new Mission(missionConfig);
        this.models.push(mission);

        if (!this.config.missions) {
            this.config.set("missions", []);
        }
        this.config.missions.push(missionConfig);

        return mission;
    },

    /**
     * Returns a mission by ID.
     */
    get: function(id) {

        return _.find(this.models, { id: id });
    },

    /**
     * Removes a mission.
     */
    remove: function(id) {

        var index = _.findIndex(this.config.missions, { id: id });
        if (index > -1) {
            this.config.missions.remove(index);

            this.models.splice(_.findIndex(this.models, { id: id }), 1);

            return true;
        } else {
            return false;
        }
    },

    /**
     * Converts all missions to their JSON representation.
     */
    toJSON: function() {

        return _.map(this.models, function(mission) {
            return mission.toJSON();
        });
    },

    /**
     * Updates a mission.
     */
    update: function(missionData) {

        var mission = this.get(missionData.id);
        if (mission) {
            _.each(missionData, function(value, propertyName) {
                if (propertyName !== "id") {
                    mission.set(propertyName, value);
                }
            });
        } else {
            throw Errors.notFound();
        }
    },

    _init: function() {

        this.models = _.map(this.config.missions, function(config) {
            return new Mission(config);
        }, this);
    }

});


module.exports = Missions;
