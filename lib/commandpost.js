"use strict";


var _ = require("lodash");
var Campaigns = require("./campaigns");
var Errors = require("./errors");
var Missions = require("./missions");
var Schedular = require("./schedular");
var Workspaces = require("./workspaces");


/**
 * Command Post.
 *
 * Keeps track of all missions, and dispatches them to slaves.
 */
function CommandPost(config, slaveDriver, clientPool) {

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

_.extend(CommandPost.prototype, {

    /**
     * Adds a new campaign.
     */
    addCampaign: function(campaignData) {

        if (campaignData.id) {
            throw Errors.invalidData("No ID expected");
        }

        this._processCampaignWorkspaces(campaignData);
        this._processCampaignMissions(campaignData);

        var campaign = this._bindCampaign(this.campaigns.add(campaignData));

        this._assignCampaignMissions(campaign);

        this.schedular.updateSchedules();

        this.clients.notifyAll("campaigns:add", { campaign: campaign.toJSON() });

        return campaign.id;
    },

    /**
     * Adds a new mission.
     */
    addMission: function(missionData) {

        if (missionData.id) {
            throw Errors.invalidData("No ID expected");
        }

        this._processMissionWorkspace(missionData);

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
                job.setSocket(slave.socket);
                job.set("assignedSlave", slave.name);
                job.set("status", "running");

                var missionConfig = {
                    command: mission.command,
                    environment: mission.config.environment,
                    id: mission.id,
                    jobs: [job.toJSON()],
                    shell: mission.shell || this.config.defaults.shell,
                    timeout: mission.timeout,
                    workspace: mission.workspace
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

        var campaign = this.campaigns.get(id);
        if (!campaign) {
            return false;
        }

        var result = this.campaigns.remove(id);
        if (result) {
            this.schedular.updateSchedules();

            this.campaigns.each(function(campaign) {
                if (_.contains(campaign.prerequisites, id)) {
                    campaign.set("prerequisites", _.without(campaign.prerequisites, id));
                    this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
                }
            }, this);

            _.each(campaign.getMissionIds(), function(missionId) {
                this._cleanupMission(missionId);
            }, this);

            _.each(campaign.workspaces, function(workspaceId) {
                this._cleanupWorkspace(workspaceId);
            }, this);

            this.clients.notifyAll("campaigns:remove", { id: id });
        }
        return result;
    },

    /**
     * Removes a mission.
     */
    removeMission: function(id) {

        var mission = this.missions.get(id);
        if (!mission) {
            return false;
        }

        var result = this.missions.remove(id);
        if (result) {
            this._cleanupWorkspace(mission.workspace);

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
        if (!campaign) {
            throw Errors.notFound();
        }

        if (campaign.status !== "active") {
            campaign.startNextPhase();
            this.activeCampaigns.push(campaign);

            this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
        }
    },

    /**
     * Starts a new job for executing a mission.
     */
    startMission: function(missionId) {

        var mission = this.missions.get(missionId);
        if (!mission) {
            throw Errors.notFound();
        }

        mission.addQueuedJob();
        this.jobQueue.push(mission);

        if (this.jobQueue.length === 1) {
            this.slaveDriver.notifyAll("queue:job-available");
        }
    },

    /**
     * Stops a campaign.
     */
    stopCampaign: function(campaignId) {

        var campaign = this.campaigns.get(campaignId);
        if (!campaign) {
            throw Errors.notFound();
        }

        if (campaign.status === "active") {
            campaign.stop();
            this.activeCampaigns = _.without(this.activeCampaigns, campaign);

            this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
        }
    },

    /**
     * Stops the oldest queued or running job.
     */
    stopMission: function(missionId) {

        var mission = this.missions.get(missionId);
        if (!mission) {
            throw Errors.notFound();
        }

        mission.stopOldestActiveJob();
        this.jobQueue = _.without(this.jobQueue, mission);

        this.clients.notifyAll("missions:update", { mission: mission.toJSON() });
    },

    /**
     * Updates a campaign.
     */
    updateCampaign: function(campaignData) {

        this._processCampaignWorkspaces(campaignData);
        this._processCampaignMissions(campaignData);

        var campaign = this.campaigns.update(campaignData);

        this._assignCampaignMissions(campaign);

        this.schedular.updateSchedules();

        this.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
    },

    /**
     * Updates a mission.
     */
    updateMission: function(missionData) {

        this._processMissionWorkspace(missionData);

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

    _assignCampaignMissions: function(campaign) {

        _.each(campaign.getMissionIds(), function(missionId) {
            var mission = this.missions.get(missionId);
            var campaigns = mission.campaigns;
            if (!_.contains(campaigns, campaign.id)) {
                campaigns.push(campaign.id);
                mission.set("campaigns", campaigns);

                this.clients.notifyAll("missions:update", { mission: mission.toJSON() });
            }
        }, this);
    },

    _bindCampaign: function(campaign) {

        var self = this;
        campaign.commandPost = self;

        campaign.on("change:status", function() {
            if (campaign.status !== "active") {
                self.activeCampaigns = _.without(self.activeCampaigns, campaign);

                if (campaign.status === "success") {
                    this._startFollowUpCampaigns(campaign);
                }
            }

            self.clients.notifyAll("campaigns:update", { campaign: campaign.toJSON() });
        });
        return campaign;
    },

    _bindMission: function(mission) {

        var self = this;
        mission.on("job:output", function(event) {
            self.clients.notifyAll("missions:job-output", {
                jobId: event.job.id,
                missionId: mission.id,
                output: event.output
            });
        });
        mission.on("change:status", function() {
            self.clients.notifyAll("missions:update", { mission: mission.toJSON() });

            if (mission.status === "success" || mission.status === "failed") {
                _.each(self.activeCampaigns, function(campaign) {
                    campaign.missionCompleted(mission);
                });
            }
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

    _cleanupMission: function(missionId, options) {

        options = options || {};

        var isInUse = (
            _.any(this.campaigns.without(options.exceptCampaign), function(campaign) {
                return _.contains(campaign.getMissionIds(), missionId);
            })
        );

        if (!isInUse) {
            var mission = this.missions.get(missionId);
            if (mission && !mission.standalone) {
                this.removeMission(missionId);
            }
        }
    },

    _cleanupWorkspace: function(workspaceId, options) {

        options = options || {};

        var isInUse = (
            _.any(this.campaigns.without(options.exceptCampaign), function(campaign) {
                return _.contains(campaign.workspaces, workspaceId);
            }) ||
            _.any(this.missions.without(options.exceptMission), { workspace: workspaceId })
        );

        if (!isInUse) {
            this.removeWorkspace(workspaceId);
        }
    },

    _init: function() {

        this.campaigns.each(function(campaign) {
            this._bindCampaign(campaign);
        }, this);

        this.missions.each(function(mission) {
            this._bindMission(mission);
        }, this);

        this.schedular = new Schedular(this);
        this.schedular.updateSchedules();

        this.slaveDriver.on("slave-disconnected", _.bind(this._onSlaveDisconnected, this));
    },

    _onSlaveDisconnected: function(event) {

        var slave = event.slave;
        this.missions.each(function(mission) {
            var lastJob = mission.jobs.length > 0 && mission.jobs[mission.jobs.length - 1];
            if (lastJob && lastJob.status === "running" && lastJob.assignedSlave === slave.name) {
                lastJob.set("status", "failed");
            }
        }, this);
    },

    _processCampaignMissions: function(campaignData) {

        _.each(campaignData.phases, function(phase) {
            phase.missions = _.map(phase.missions, function(mission) {
                if (typeof mission === "string") {
                    if (!this.missions.get(mission)) {
                        throw Errors.notFound("Referenced mission not found");
                    }

                    return mission;
                } else if (mission.id) {
                    this.updateMission(mission);
                    return mission.id;
                } else {
                    return this.addMission(mission);
                }
            }, this);
        }, this);

        if (campaignData.id) {
            var campaign = this.campaigns.get(campaignData.id);
            if (!campaign) {
                throw Errors.notFound();
            }

            var originalMissions = campaign.getMissionIds();
            var newMissions = _.uniq(_.flatten(_.pluck(campaignData.phases, "missions")));
            var removedMissions = _.difference(originalMissions, newMissions);
            _.each(removedMissions, function(mission) {
                this._cleanupMission(mission, { exceptCampaign: campaign });
            }, this);
        }
    },

    _processCampaignWorkspaces: function(campaignData) {

        campaignData.workspaces = _.map(campaignData.workspaces, function(workspace) {
            if (typeof workspace === "string") {
                if (!this.workspaces.get(workspace)) {
                    throw Errors.invalidData("Referenced workspace not found");
                }

                return workspace;
            } else if (workspace.id) {
                this.updateWorkspace(workspace);
                return workspace.id;
            } else {
                return this.addWorkspace(workspace);
            }
        }, this);

        if (campaignData.id) {
            var campaign = this.campaigns.get(campaignData.id);
            if (!campaign) {
                throw Errors.notFound();
            }

            var originalWorkspaces = campaign.workspaces;
            var removedWorkspaces = _.difference(campaignData.workspaces, originalWorkspaces);
            _.each(removedWorkspaces, function(workspaceId) {
                this._cleanupWorkspace(workspaceId, { exceptCampaign: campaign });
            }, this);
        }

        _.each(campaignData.phases, function(phaseData) {
            _.each(phaseData.missions, function(missionData) {
                if (!missionData.workspace && missionData.workspaceName) {
                    missionData.workspace = _.find(campaignData.workspaces, function(workspaceId) {
                        return this.workspaces.get(workspaceId).name === missionData.workspaceName;
                    }, this);
                }
                delete missionData.workspaceName;
            }, this);
        }, this);
    },

    _processMissionWorkspace: function(missionData) {

        var workspace = missionData.workspace;
        if (workspace) {
            if (typeof workspace === "string") {
                if (!this.workspaces.get(workspace)) {
                    throw Errors.invalidData("Referenced workspace not found");
                }
            } else {
                if (workspace.id) {
                    this.updateWorkspace(workspace);
                    workspace = workspace.id;
                } else {
                    workspace = this.addWorkspace(workspace);
                }
            }
        } else {
            throw Errors.invalidData("Missing workspace");
        }
        missionData.workspace = workspace;

        if (missionData.id) {
            var mission = this.missions.get(missionData.id);
            if (!mission) {
                throw Errors.notFound();
            }

            this._cleanupWorkspace(workspace, { exceptMission: mission });
        }
    },

    _startFollowUpCampaigns: function(campaign) {

        this.campaigns.each(function(followUpCampaign) {
            if (followUpCampaign.id === campaign.id || followUpCampaign.status === "active") {
                return;
            }

            if (_.contains(followUpCampaign.prerequisites, campaign.id)) {
                if (_.all(followUpCampaign.prerequisites, function(prerequisiteCampaignId) {
                    var prerequisiteCampaign = this.campaigns.get(prerequisiteCampaignId);
                    return prerequisiteCampaign.status === "success";
                }, this)) {
                    this.startCampaign(followUpCampaign.id);
                }
            }
        }, this);
    }

});


module.exports = CommandPost;
