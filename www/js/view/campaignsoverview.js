define("view/campaignsoverview",
       ["continuouspager", "i18n", "jquery", "tmpl/campaignitem", "tmpl/campaignsoverview",
        "tmpl/nocampaigns"],
       function(ContinuousPager, i18n, $, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.campaigns;

            this.emptyTemplate = tmpl.nocampaigns;

            this.itemTemplate = tmpl.campaignitem;

            this.template = tmpl.campaignsoverview;
        },

        events: {
            "click .action-edit": "_edit",
            "click .action-new": "_new",
            "click .action-remove": "_remove"
        },

        _edit: function(event) {

            var campaignId = this.targetData(event, "campaign-id");
            this.application.navigateTo("campaign/" + campaignId + "/edit");
        },

        _new: function() {

            this.application.navigateTo("campaign/new");
        },

        _remove: function(event) {

            var $action = this.$(".action-remove");
            $action.html($("<i>").addClass("fa fa-refresh fa-spin"));

            var campaign = this.collection.get(this.targetData(event, "campaign-id"));

            this.application.confirm(i18n("Are you sure you want to remove the campaign <b>%1</b>?")
                                     .arg(campaign.name), {
                context: this,
                title: i18n("Remove campaign")
            }).then(function() {
                campaign.remove({ context: this }).fail(function(error) {
                    this.showError(i18n("Could not remove the campaign"), error);
                });
            });
        }

    });

});
