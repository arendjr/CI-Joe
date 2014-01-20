"use strict";


var Campaign = require("./campaign");
var Collection = require("./collection");


/**
 * Campaigns.
 *
 * Container for all campaigns.
 */
module.exports = Collection.extend({

    initialize: function() {

        this.key = "campaigns";

        this.Model = Campaign;
    }

});
