define("view/campaignsoverview",
       ["continuouspager", "i18n", "jquery", "laces", "timestamps", "tmpl/campaignitem",
        "tmpl/campaignsoverview", "tmpl/nocampaigns"],
       function(ContinuousPager, i18n, $, Laces, Timestamps, tmpl) {

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
            "click .action-remove": "_remove",
            "click .action-start": "_start",
            "click .action-stop": "_stop"
        },

        renderItem: function(model) {

            var tie = new Laces.Tie(model, this.itemTemplate);
            var $el = $(tie.render()).children();

            $el.attr("data-item-id", model.id);

            Timestamps.process($el.find("[data-timestamp]"));

            return $el;
        },

        _edit: function(event) {

            var campaignId = this.targetData(event, "campaign-id");
            this.application.navigateTo("campaign/" + campaignId + "/edit");
        },

        _new: function() {

            this.application.navigateTo("campaign/new");
        },

        _remove: function(event) {

            var campaign = this.collection.get(this.targetData(event, "campaign-id"));

            this.application.confirm(i18n("Are you sure you want to remove the campaign <b>%1</b>?")
                                     .arg(campaign.name), {
                context: this,
                title: i18n("Remove campaign")
            }).then(function() {
                var $action = $(event.target).closest(".action-remove");
                $action.removeClass("icon-trash").addClass("icon-refresh fa-spin");

                campaign.remove({ context: this }).fail(function(error) {
                    $action.removeClass("icon-refresh fa-spin").addClass("icon-trash");

                    this.showError(i18n("Could not remove the campaign"), error);
                });
            });
        },

        _start: function(event) {

            var campaign = this.collection.get(this.targetData(event, "campaign-id"));
            campaign.start();
            return false;
        },

        _stop: function(event) {

            var campaign = this.collection.get(this.targetData(event, "campaign-id"));
            campaign.stop();
            return false;
        }

    });

});
