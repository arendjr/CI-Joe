define("lightbox/editmission",
       ["i18n", "laces.tie", "lightbox", "lodash", "tmpl/editmission"],
       function(i18n, Laces, Lightbox, _, tmpl) {

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
                var name = i18n("Unnamed Mission").toString();
                var index = 1;
                while (_.any(this.application.missions, { name: name })) {
                    index++;
                    name = i18n("Unnamed Mission") + " " + index;
                }
                mission.name = name;

                this.title = i18n("New Mission");
            }

            this.mission = mission;
        },

        events: {
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());
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
        },

        _toggleAdvanced: function() {

            this.mission.advancedOptionsExpanded = !this.mission.advancedOptionsExpanded;
        }

    });

});
