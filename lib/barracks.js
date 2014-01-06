"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Laces = require("laces.js");
var Workspace = require("./workspace");
var util = require("util");


/**
 * Barracks.
 *
 * Getting out of inspiration with the metaphors, but this one keeps all the workspaces.
 */
function Barracks(config, clientPool) {

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
     * Array with all the workspace instances.
     */
    this.workspaces = [];

    this._init();
}

util.inherits(Barracks, EventEmitter);

_.extend(Barracks.prototype, {

    /**
     * Adds a new workspace.
     */
    addWorkspace: function(workspaceData) {

        var workspaceConfig = new Laces.Map({
            id: Workspace.uniqueId(this.workspaces),
            name: workspaceData.name
        });

        var workspace = new Workspace(workspaceConfig);
        this.workspaces.push(workspace);

        if (!this.config.workspaces) {
            this.config.set("workspaces", []);
        }
        this.config.workspaces.push(workspaceConfig);

        this.clients.notifyAll("workspaces:add", { workspace: workspace.toJSON() });

        return workspaceConfig.id;
    },

    /**
     * Returns a workspace by ID.
     */
    getWorkspace: function(id) {

        return _.find(this.workspaces, { id: id });
    },

    /**
     * Removes a workspace.
     */
    removeWorkspace: function(id) {

        var index = _.findIndex(this.config.workspaces, { id: id });
        if (index > -1) {
            this.config.workspaces.remove(index);

            this.workspaces.splice(_.findIndex(this.workspaces, { id: id }), 1);

            this.clients.notifyAll("workspaces:remove", { id: id });

            return true;
        } else {
            return false;
        }
    },

    /**
     * Updates a workspace.
     */
    updateWorkspace: function(workspaceData) {

        var workspace = this.getworkspace(workspaceData.id);
        if (workspace) {
            workspace.setName(workspaceData.name);

            this.clients.notifyAll("workspaces:update", { workspace: workspace.toJSON() });
        }
        return !!workspace;
    },

    _init: function() {

        var self = this;
        this.workspaces = _.map(this.config.workspaces, function(config) {
            var workspace = new Workspace(config);
            workspace.on("change", function() {
                self.clients.notifyAll("workspaces:update", { workspace: workspace.toJSON() });
            });
            return workspace;
        });
    }

});


module.exports = Barracks;
