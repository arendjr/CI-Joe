"use strict";


var Model = require("./model");


/**
 * Workspace.
 *
 * Maintains a single workspace.
 */
module.exports = Model.extend({

    initialize: function(config) {

        /**
         * Name of the workspace.
         *
         * Read-only property. Use set() for setting.
         */
        this.name = config.name;

        /**
         * Type of workspace. Currently, only "empty" is supported.
         *
         * Read-only property. Use set() for setting.
         */
        this.type = config.type || "empty";
    },

    type: "workspace"

});
