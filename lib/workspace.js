"use strict";


var Errors = require("./errors");
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
         */
        this.set("name", config.name || "");

        /**
         * Type of workspace. Currently, only "empty" is supported.
         */
        this.set("type", config.type || "empty", {
            setFilter: function(type) {
                if (type === "empty") {
                    return type;
                } else {
                    throw Errors.serverError("Invalid slave type: " + type);
                }
            }
        });
    },

    type: "workspace"

});
