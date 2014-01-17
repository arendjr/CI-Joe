"use strict";


var _ = require("lodash");
var Campaign = require("./campaign");
var Errors = require("./errors");
var Laces = require("laces.js");


/**
 * Campaigns.
 *
 * Container for all campaigns.
 */
function Campaigns(config) {

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array of campaigns.
     */
    this.campaigns = [];

    this._init();
}

_.extend(Campaigns.prototype, {

    /**
     * Adds a campaign.
     */
    add: function(campaignData) {

        var campaignConfig = new Laces.Map({
            id: Campaign.uniqueId(this.missions)
        });
        _.each(campaignData, function(value, propertyName) {
            campaignConfig.set(propertyName, value);
        });

        var campaign = new Campaign(campaignConfig);
        this.campaigns.push(campaign);

        if (!this.config.campaigns) {
            this.config.set("campaigns", []);
        }
        this.config.campaigns.push(campaignConfig);

        return campaign;
    },

    /**
     * Returns a campaign by ID.
     */
    get: function(id) {

        return _.find(this.campaigns, { id: id });
    },

    /**
     * Removes a campaign.
     */
    remove: function(id) {

        var index = _.findIndex(this.config.campaigns, { id: id });
        if (index > -1) {
            this.config.campaigns.remove(index);

            this.campaigns.splice(_.findIndex(this.campaigns, { id: id }), 1);

            return true;
        } else {
            return false;
        }
    },

    /**
     * Converts all campaigns to their JSON representation.
     */
    toJSON: function() {

        return _.map(this.campaigns, function(campaign) {
            return campaign.toJSON();
        });
    },

    /**
     * Updates a campaign.
     */
    update: function(campaignData) {

        var campaign = this.get(campaignData.id);
        if (campaign) {
            _.each(campaignData, function(value, propertyName) {
                if (propertyName !== "id") {
                    campaign.set(propertyName, value);
                }
            });
        } else {
            throw Errors.notFound();
        }
    },

    _init: function() {

        this.campaigns = _.map(this.config.campaigns, function(config) {
            return new Campaign(config);
        }, this);
    }

});


module.exports = Campaigns;
