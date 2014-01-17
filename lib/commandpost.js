"use strict";


var _ = require("lodash");
var Campaigns = require("./campaigns");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var Missions = require("./missions");
var Schedular = require("./schedular");
var Workspaces = require("./workspaces");
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
     * Campaigns collection.
     */
    this.campaigns = new Campaigns(config);

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
     * Missions collection.
     */
    this.missions = new Missions(config);

    /**
     * Schedular instance.
     */
    this.schedular = null;

    /**
     * Slave Driver instance.
     */
    this.slaveDriver = slaveDriver;

    /**
     * Workspaces collection.
     */
    this.workspaces = new Workspaces(config);

    this._init();
}

util.inherits(CommandPost, EventEmitter);

_.extend(CommandPost.prototype, {

    /**
     * Adds a new campaign.
     */
    addCampaign: function(campaignData) {

        this._processCampaignWorkspaces(campaignData);

        var campaign = this._bindCampaign(this.campaigns.add(campaignData));

        this.schedular.updateSchedules();

        this.clients.notifyAll("campaigns:add", { campaign: campaign.toJSON() });

        return campaign.id;
    },

    /**
     * Adds a new mission.
     */
    addMission: function(missionData) {

        var mission = this._bindMission(this.missions.add(missionData));

        this.clients.notifyAll("missions:add", { mission: mission.toJSON() });

        return mission.id;
    },

    /**
     * Adds a new workspace.
     */
    addWorkspace: function(workspaceData) {

        var workspace = this.workspaces.add(workspaceData);

        this.clients.notifyAll("workspaces:add", { workspace: workspace.toJSON() });

        return workspace.id;
    },

    /**
     * Dispatches a job to a slave.
     */
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

    /**
     * Removes a campaign.
     */
    removeCampaign: function(id) {

        var result = this.campaigns.remove(id);
        if (result) {
            this.schedular.updateSchedules();

            this.clients.notifyAll("campaigns:remove", { id: id });
        }
        return result;
    },

    /**
     * Removes a mission.
     */
    removeMission: function(id) {

        var result = this.missions.remove(id);
        if (result) {
            this.clients.notifyAll("missions:remove", { id: id });
        }
        return result;
    },

    /**
     * Removes a workspace.
     */
    removeWorkspace: function(id) {

        var result = this.workspaces.remove(id);
        if (result) {
            this.clients.notifyAll("workspaces:remove", { id: id });
        }
        return result;
    },

    /**
     * Starts a campaign.
     */
    startCampaign: function(campaignId) {

        var campaign = this.campaigns.get(campaignId);
        this.activeCampaigns.push(campaign);
    },

    /**
     * Starts a new job.
     */
    startJob: function(missionId) {

        var mission = this.missions.get(missionId);
        mission.addQueuedJob();
        this.jobQueue.push(mission);

        if (this.jobQueue.length === 1) {
            this.slaveDriver.notifyAll("queue:job-available");
        }
    },

    /**
     * Updates a campaign.
     */
    updateCampaign: function(campaignData) {

        this._processCampaignWorkspaces(campaignData);

        var campaign = this.campaigns.update(campaignData);
        this.schedular.updateSchedules();
        this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
    },

    /**
     * Updates a mission.
     */
    updateMission: function(missionData) {

        var mission = this.missions.update(missionData);
        this.clients.notifyAll("missions:update", { mission: mission.toJSON() });
    },

    /**
     * Updates a workspace.
     */
    updateWorkspace: function(workspaceData) {

        var workspace = this.workspaces.update(workspaceData);
        this.clients.notifyAll("workspaces:update", { workspace: workspace.toJSON() });
    },

    _bindCampaign: function(campaign) {

        var self = this;
        campaign.on("change", function(key) {
            if (key === "runs") {
                self.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
            }
        });
        return campaign;
    },

    _bindMission: function(mission) {

        var self = this;
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

        this.schedular = new Schedular(this);
        this.schedular.updateSchedules();

        this.slaveDriver.on("slave-disconnected", _.bind(this._onSlaveDisconnected, this));
    },

    _onSlaveDisconnected: function(event) {

        var slave = event.slave;
        _.each(this.missions.models, function(mission) {
            var lastJob = mission.jobs.length > 0 && mission.jobs[mission.jobs.length - 1];
            if (lastJob && lastJob.status === "running" && lastJob.assignedSlave === slave.name) {
                lastJob.setStatus("failed");
            }
        }, this);
    },

    _processCampaignWorkspaces: function(campaignData) {

        campaignData.workspaces = _.map(campaignData.workspaces, function(workspace) {
            if (typeof workspace === "string") {
                return workspace;
            } else {
                return this.workspaces.add(workspace);
            }
        }, this);

        var campaign = this.campaigns.get(campaignData.id);
        if (!campaign) {
            throw Errors.notFound();
        }

        var originalWorkspaces = campaign.workspaces;
        var removedWorkspaces = _.diff(campaignData.workspaces, originalWorkspaces);
        _.each(removedWorkspaces, function(workspace) {
            var isInUse = (
                _.any(this.campaigns, function(campaign) {
                    return _.contains(campaign.workspaces, workspace);
                }) ||
                _.any(this.missions, { workspace: workspace })
            );

            if (!isInUse) {
                this.workspaces.remove(workspace);
            }
        }, this);
    }

});


module.exports = CommandPost;
