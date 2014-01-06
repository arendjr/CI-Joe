define("view/editcampaign",
       ["i18n", "laces", "lodash", "view", "view/scheduleoptions", "tmpl/editcampaign"],
       function(i18n, Laces, _, View, ScheduleOptionsView, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var campaign = this.createModel("campaign");
            campaign.set(options.campaign);
            this.campaign = campaign;

            this.scheduleOptions = null;
        },

        events: {
            "click .action-cancel": "_cancel",
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced"
        },

        render: function() {

            this.removeChildren();

            var tie = new Laces.Tie(this.campaign, tmpl.editcampaign);
            this.$el.html(tie.render());

            this.scheduleOptions = new ScheduleOptionsView(this, { model: this.campaign });
            this.$(".js-schedule").html(this.scheduleOptions.render());

            return this.$el;
        },

        _cancel: function() {

            this.application.navigateTo("campaigns");
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

        _toggleAdvanced: function() {

            this.campaign.advancedOptionsExpanded = !this.campaign.advancedOptionsExpanded;
        }

    });

});
