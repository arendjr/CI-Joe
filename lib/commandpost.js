"use strict";


var _ = require("lodash");
var Campaign = require("./campaign");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
var Mission = require("./mission");
var Schedular = require("./schedular");
var util = require("util");


/**
 * Command Post.
 *
 * Keeps track of all missions, and dispatches them to slaves.
 */
function CommandPost(config, slaveDriver, clientPool) {

    EventEmitter.call(this);

    /**
     * Array of campaigns which are currently active.
     */
    this.activeCampaigns = [];

    /**
     * Array with all the campaigns.
     */
    this.campaigns = [];

    /**
     * Client Pool instance.
     */
    this.clients = clientPool;

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array of jobs waiting to be executed.
     */
    this.jobQueue = [];

    /**
     * Array with all the missions.
     */
    this.missions = [];

    /**
     * Schedular instance.
     */
    this.schedular = null;

    /**
     * Slave Driver instance.
     */
    this.slaveDriver = slaveDriver;

    this._init();
}

util.inherits(CommandPost, EventEmitter);

_.extend(CommandPost.prototype, {

    addCampaign: function(campaignData) {

        var campaignConfig = new Laces.Map({
            id: Campaign.uniqueId(this.missions),
            name: campaignData.name,
            phases: campaignData.phases,
            schedule: campaignData.schedule,
            workspaces: campaignData.workspaces
        });

        var campaign = this._createCampaign(campaignConfig);
        this.campaigns.push(campaign);

        if (!this.config.campaigns) {
            this.config.set("campaigns", []);
        }
        this.config.campaigns.push(campaignConfig);

        this.schedular.updateSchedules();

        this.clients.notifyAll("campaigns:add", { campaign: campaign.toJSON() });

        return campaignConfig.id;
    },

    addMission: function(missionData) {

        var missionConfig = new Laces.Map({
            command: missionData.command,
            id: Mission.uniqueId(this.missions),
            name: missionData.name,
            shell: missionData.shell,
            timeout: missionData.timeout,
            workspace: missionData.workspace
        });

        var mission = this._createMission(missionConfig);
        this.missions.push(mission);

        if (!this.config.missions) {
            this.config.set("missions", []);
        }
        this.config.missions.push(missionConfig);

        this.clients.notifyAll("missions:add", { mission: mission.toJSON() });

        return missionConfig.id;
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
                    command: mission.command,
                    environment: mission.config.environment,
                    id: mission.id,
                    jobs: [job.toJSON()],
                    shell: mission.shell || this.config.defaults.shell,
                    timeout: mission.timeout
                };
                slave.notify("job:start", { mission: missionConfig });

                queue.splice(i, 1);
                break;
            }
        }
    },

    getCampaign: function(id) {

        return _.find(this.campaigns, { id: id });
    },

    getMission: function(id) {

        return _.find(this.missions, { id: id });
    },

    removeCampaign: function(id) {

        var index = _.findIndex(this.config.campaigns, { id: id });
        if (index > -1) {
            this.config.campaigns.remove(index);

            this.campaigns.splice(_.findIndex(this.campaigns, { id: id }), 1);

            this.schedular.updateSchedules();

            this.clients.notifyAll("campaigns:remove", { id: id });

            return true;
        } else {
            return false;
        }
    },

    removeMission: function(id) {

        var index = _.findIndex(this.config.missions, { id: id });
        if (index > -1) {
            this.config.missions.remove(index);

            this.missions.splice(_.findIndex(this.missions, { id: id }), 1);

            this.clients.notifyAll("missions:remove", { id: id });

            return true;
        } else {
            return false;
        }
    },

    startCampaign: function(campaignId) {

        var campaign = this.getCampaign(campaignId);
        this.activeCampaigns.push(campaign);
    },

    startJob: function(missionId) {

        var mission = this.getMission(missionId);
        mission.addQueuedJob();
        this.jobQueue.push(mission);

        if (this.jobQueue.length === 1) {
            this.slaveDriver.notifyAll("queue:job-available");
        }
    },

    updateCampaign: function(campaignData) {

        var campaign = this.getCampaign(campaignData.id);
        if (campaign) {
            campaign.setPhases(campaignData.actions);
            campaign.setName(campaignData.name);
            campaign.setSchedule(campaignData.schedule);

            this.schedular.updateSchedules();

            this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
        }
        return !!campaign;
    },

    updateMission: function(missionData) {

        var mission = this.getMission(missionData.id);
        if (mission) {
            mission.setCommand(missionData.command);
            mission.setName(missionData.name);
            mission.setShell(missionData.shell);
            mission.setTimeout(missionData.timeout);
            mission.setWorkspace(missionData.workspace);

            this.clients.notifyAll("missions:update", { mission: mission.toJSON() });
        }
        return !!mission;
    },

    _createCampaign: function(config) {

        var self = this;
        var campaign = new Campaign(config);
        campaign.on("change", function(key) {
            if (key === "jobs") {
                self.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
            }
        });
        return campaign;
    },

    _createMission: function(config) {

        var self = this;
        var mission = new Mission(config);
        mission.on("change", function(key) {
            if (key === "jobs") {
                self.clients.notifyAll("missions:update", { mission: mission.toJSON() });
            }
        });
        mission.on("update:action-results", function(job) {
            self.clients.notifyAll("missions:update-action-results", {
                actionResults: job.actionResults,
                jobId: job.id,
                missionId: mission.id,
                status: job.status
            });
        });
        mission.on("exception", function(exception, message) {
            self.clients.notifyAll("exception", {
                exception: exception.toString(),
                message: message || "",
                stacktrace: exception.stack
            });
        });
        return mission;
    },

    _init: function() {

        this.campaigns = _.map(this.config.campaigns, function(config) {
            return this._createCampaign(config);
        }, this);

        this.missions = _.map(this.config.missions, function(config) {
            return this._createMission(config);
        }, this);

        this.schedular = new Schedular(this);
        this.schedular.updateSchedules();

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
