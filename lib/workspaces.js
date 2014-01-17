"use strict";


var _ = require("lodash");
var Workspace = require("./workspace");
var Errors = require("./errors");
var Laces = require("laces.js");


/**
 * Workspaces.
 *
 * Container for all workspaces.
 */
function Workspaces(config) {

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array of workspaces.
     */
    this.workspaces = [];

    this._init();
}

_.extend(Workspaces.prototype, {

    /**
     * Adds a workspace.
     */
    add: function(workspaceData) {

        var workspaceConfig = new Laces.Map({
            id: Workspace.uniqueId(this.workspaces)
        });
        _.each(workspaceData, function(value, propertyName) {
            workspaceConfig.set(propertyName, value);
        });

        var workspace = new Workspace(workspaceConfig);
        this.workspaces.push(workspace);

        if (!this.config.workspaces) {
            this.config.set("workspaces", []);
        }
        this.config.workspaces.push(workspaceConfig);

        return workspace;
    },

    /**
     * Returns a workspace by ID.
     */
    get: function(id) {

        return _.find(this.workspaces, { id: id });
    },

    /**
     * Removes a workspace.
     */
    remove: function(id) {

        var index = _.findIndex(this.config.workspaces, { id: id });
        if (index > -1) {
            this.config.workspaces.remove(index);

            this.workspaces.splice(_.findIndex(this.workspaces, { id: id }), 1);

            return true;
        } else {
            return false;
        }
    },

    /**
     * Converts all workspaces to their JSON representation.
     */
    toJSON: function() {

        return _.map(this.workspaces, function(workspace) {
            return workspace.toJSON();
        });
    },

    /**
     * Updates a workspace.
     */
    update: function(workspaceData) {

        var workspace = this.get(workspaceData.id);
        if (workspace) {
            _.each(workspaceData, function(value, propertyName) {
                if (propertyName !== "id") {
                    workspace.set(propertyName, value);
                }
            });
        } else {
            throw Errors.notFound();
        }
    },

    _init: function() {

        this.workspaces = _.map(this.config.workspaces, function(config) {
            return new Workspace(config);
        }, this);
    }

});


module.exports = Workspaces;
