define("lightbox/editmission",
       ["i18n", "laces", "lightbox", "tmpl/editmission"],
       function(i18n, Laces, Lightbox, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var mission = this.createModel("mission");
            if (options.mission) {
                mission.set(options.mission.toJSON());

                this.title = i18n("Edit %1").arg(mission.name);

                this.buttons.unshift({
                    label: i18n("Remove"),
                    extraClass: "action-remove btn-danger pull-left"
                });
            } else {
                mission.name = i18n("Unnamed mission").toString();

                this.title = i18n("New Mission");
            }

            this.mission = mission;
        },

        events: {
            "click .action-save": "_save"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());
        },

        _remove: function() {

            var $button = this.$(".action-remove");
            $button.addClass("btn-progress");

            this.mission.remove({ context: this }).then(function() {
                this.resolve();
            }, function(error) {
                this.showError(i18n("Could not remove the mission"), error);
            }).always(function() {
                $button.removeClass("btn-progress");
            });
        },

        _save: function() {

            var $button = this.$(".action-save");
            $button.addClass("btn-progress");

            this.mission.save({ context: this }).then(function() {
                this.resolve();
            }, function(error) {
                this.showError(i18n("Could not save the mission"), error);
            }).always(function() {
                $button.removeClass("btn-progress");
            });
        }

    });

});
