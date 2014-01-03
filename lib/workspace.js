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
}

_.extend(Workspace.prototype, {});


module.exports = Workspace;
