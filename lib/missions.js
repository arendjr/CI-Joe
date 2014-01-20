"use strict";


var Collection = require("./collection");
var Mission = require("./mission");


/**
 * Missions.
 *
 * Container for all missions.
 */
module.exports = Collection.extend({

    initialize: function() {

        this.key = "missions";

        this.Model = Mission;
    }

});
