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

            this.subscribe(mission, "change:actions", "renderContent");
        },

        events: {
            "click .action-add-action": "_addAction",
            "click .action-edit-action": "_editAction",
            "click .action-remove-action": "_removeAction",
            "click .action-remove": "_remove",
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());
        },

        _addAction: function() {

            this.openLightbox("EditAction", { context: this }).then(function(action) {
                this.mission.actions.push(action);
            });
        },

        _editAction: function(event) {

            var index = this.targetData(event, "action-index");
            this.openLightbox("EditAction", { action: this.mission.actions[index] });
        },

        _removeAction: function(event) {

            var index = this.targetData(event, "action-index");
            this.mission.actions.splice(index, 1);
        },

        _remove: function() {

            var $button = this.$(".action-remove");
            $button.addClass("btn-progress");

            this.application.confirm(i18n("Are you sure you want to remove this mission?"), {
                context: this,
                title: i18n("Remove mission")
            }).then(function() {
                this.mission.remove({ context: this }).then(function() {
                    this.resolve();
                }, function(error) {
                    this.showError(i18n("Could not remove the mission"), error);
                }).always(function() {
                    $button.removeClass("btn-progress");
                });
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
        },

        _toggleAdvanced: function() {

            var $chevron = this.$(".js-chevron"), $advanced = this.$(".js-advanced");
            if ($chevron.hasClass("glyphicon-chevron-right")) {
                $chevron.removeClass("glyphicon-chevron-right").addClass("glyphicon-chevron-down");
                $advanced.show();
            } else {
                $chevron.removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-right");
                $advanced.hide();
            }
        }

    });

});
