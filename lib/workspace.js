"use strict";


var _ = require("lodash");
var Errors = require("./errors");


/**
 * Workspace.
 *
 * Maintains a single workspace.
 */
function Workspace(config) {

    /**
     * Config object containing the workspace's settings.
     */
    this.config = config;

    /**
     * Workspace ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a workspace without ID");
    }

    /**
     * Name of the workspace.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;
}

/**
 * Generates a unique workspace ID.
 *
 * @param missions Array of workspaces among which the ID should be unique.
 */
Workspace.uniqueId = function(workspaces) {

    var index = 0, id = "workspace" + index;
    while (_.any(workspaces, { id: id })) {
        id = "workspace" + (++index);
    }
    return id;
};

_.extend(Workspace.prototype, {

    /**
     * Sets the name of the mission.
     */
    setName: function(name) {

        if (this.name !== name) {
            this.name = name;
            this.config.set("name", name);

            this.emit("change", "name", name);
        }
    }

});


module.exports = Workspace;
