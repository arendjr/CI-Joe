define("lightbox/editcampaign",
       ["i18n", "laces", "lightbox", "lodash", "view/scheduleoptions", "tmpl/editcampaign"],
       function(i18n, Laces, Lightbox, _, ScheduleOptionsView, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var campaign = this.createModel("campaign");
            if (options.campaign) {
                campaign.set(options.campaign.toJSON());

                this.title = i18n("Edit %1").arg(campaign.name);
            } else {
                var name = i18n("Unnamed Campaign").toString();
                var index = 1;
                while (_.any(this.application.campaigns, { name: name })) {
                    index++;
                    name = i18n("Unnamed Campaign") + " " + index;
                }
                campaign.name = name;

                this.title = i18n("New Campaign");
            }

            this.campaign = campaign;
        },

        events: {
            "click .action-save": "_save",
            "click .action-toggle-schedule": "_toggleSchedule"
        },

        renderContent: function() {

            this.removeChildren();

            var tie = new Laces.Tie(this.campaign, tmpl.editcampaign);
            this.$(".js-content").html(tie.render());

            this.scheduleOptions = new ScheduleOptionsView(this, { model: this.campaign });
            this.$(".js-schedule").html(this.scheduleOptions.render());
        },

        _save: function() {

            var $button = this.$(".action-save");
            $button.addClass("btn-progress");

            this.scheduleOptions.save();

            this.campaign.save({ context: this }).then(function() {
                this.resolve();
            }, function(error) {
                this.showError(i18n("Could not save the campaign"), error);
            }).always(function() {
                $button.removeClass("btn-progress");
            });
        },

        _toggleSchedule: function() {

            this.campaign.scheduleOptionsExpanded = !this.campaign.scheduleOptionsExpanded;
        }

    });

});
