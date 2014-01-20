"use strict";


var Collection = require("./collection");
var Workspace = require("./workspace");


/**
 * Workspaces.
 *
 * Container for all workspaces.
 */
module.exports = Collection.extend({

    initialize: function() {

        this.key = "workspaces";

        this.Model = Workspace;
    }

});
