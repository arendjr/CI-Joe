"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
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

        var missionConfig = new Laces.Map({
            id: id,
            name: missionData.name,
            shell: missionData.shell,
            actions: missionData.actions
        });

        var mission = this._createMission(missionConfig);
        this.missions.push(mission);

        if (!this.config.missions) {
            this.config.set("missions", []);
        }
        this.config.missions.push(missionConfig);

        this.clients.notifyAll("missions:add", { mission: mission.toJSON() });

        return id;
    },

    dispatchJobToSlave: function(slave) {

        var queue = this.jobQueue;
        for (var i = 0; i < queue.length; i++) {
            var mission = queue[i];
            var assignedSlaves = mission.assignedSlaves;
            var slaveMatches = (assignedSlaves.length === 0 && slave.applicability === "general") ||
                               assignedSlaves.indexOf(slave.name) > -1;

            if (slaveMatches) {
                var job = mission.jobs[mission.jobs.length - 1];
                job.setAssignedSlave(slave.name);
                job.setSocket(slave.socket);
                job.setStatus("running");

                var missionConfig = {
                    actions: mission.config.actions,
                    environment: mission.config.environment,
                    id: mission.id,
                    jobs: [job.toJSON()],
                    shell: mission.shell || this.config.defaults.shell
                };
                slave.notify("job:start", { mission: missionConfig });

                queue.splice(i, 1);
                break;
            }
        }
    },

    getMission: function(id) {

        return _.find(this.missions, { id: id });
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

    startJob: function(missionId) {

        var mission = this.getMission(missionId);
        mission.addQueuedJob();
        this.jobQueue.push(mission);

        if (this.jobQueue.length === 1) {
            this.slaveDriver.notifyAll("queue:job-available");
        }
    },

    updateMission: function(missionData) {

        var mission = this.getMission(missionData.id);
        if (mission) {
            mission.setName(missionData.name);
            mission.setShell(missionData.shell);
            mission.setActions(missionData.actions);

            this.clients.notifyAll("missions:update", { mission: mission.toJSON() });
        }
        return !!mission;
    },

    _createMission: function(config) {

        var self = this;
        var mission = new Mission(config);
        mission.on("change", function(key) {
            if (key === "jobs") {
                self.clients.notifyAll("missions:update", { mission: mission.toJSON() });
            }
        });
        return mission;
    },

    _init: function() {

        this.missions = _.map(this.config.missions, function(config) {
            return this._createMission(config);
        }, this);

        this.slaveDriver.on("slave-disconnected", _.bind(this._onSlaveDisconnected, this));
    },

    _onSlaveDisconnected: function(event) {

        var slave = event.slave;
        _.each(this.missions, function(mission) {
            var lastJob = mission.jobs.length > 0 && mission.jobs[mission.jobs.length - 1];
            if (lastJob && lastJob.status === "running" && lastJob.assignedSlave === slave.name) {
                lastJob.setStatus("failed");
            }
        }, this);
    }

});


module.exports = CommandPost;
