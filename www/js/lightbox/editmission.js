define("lightbox/editmission",
       ["i18n", "laces.tie", "lightbox", "lodash", "model/workspace", "tmpl/editmission",
        "tmpl/workspaceoptions"],
       function(i18n, Laces, Lightbox, _, Workspace, tmpl) {

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
            } else {
                var name = i18n("Unnamed Mission").toString();
                var index = 1;
                while (this.application.missions.any({ name: name })) {
                    index++;
                    name = i18n("Unnamed Mission") + " " + index;
                }
                mission.name = name;

                this.title = i18n("New Mission");
            }

            this.mission = mission;

            this.workspace = null;
        },

        events: {
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced"
        },

        renderContent: function() {

            var mission = this.mission;

            var tie = new Laces.Tie(mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());

            if (mission.standalone) {
                var workspace = mission.workspace;
                if (workspace) {
                    if (workspace instanceof Workspace) {
                        // good...
                    } else {
                        workspace = this.application.workspaces.get(workspace);
                    }
                } else {
                    workspace = new Workspace(this.application);
                }

                tie = new Laces.Tie(workspace, tmpl.workspaceoptions);
                this.$(".js-workspace").html(tie.render());

                this.workspace = workspace;
            }
        },

        _save: function() {

            var $button = this.$(".action-save");
            $button.addClass("btn-progress");

            var mission = this.mission;

            if (mission.standalone) {
                mission.workspace = this.workspace;
            }

            mission.save({ context: this }).then(function() {
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
