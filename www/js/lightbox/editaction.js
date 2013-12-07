define("lightbox/editaction",
       ["i18n", "laces", "lightbox", "lodash", "tmpl/editaction"],
       function(i18n, Laces, Lightbox, _, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var action;
            if (options.action) {
                action = new Laces.Map({
                    description: options.action.description,
                    command: options.action.command,
                    timeout: options.action.timeout
                });

                this.title = i18n("Edit Action");
            } else {
                action = new Laces.Map({
                    description: "",
                    command: "",
                    timeout: 0
                });

                this.title = i18n("New Action");
            }

            this.action = action;
        },

        events: {
            "click .action-save": "_save"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.action, tmpl.editaction);
            this.$(".js-content").html(tie.render());
        },

        _save: function() {

            var action = this.action, originalAction = this.options.action;
            if (originalAction) {
                _.each(originalAction, function(value, key) {
                    originalAction.set(key, action[key]);
                });
            }

            this.resolve(action);
        }

    });

});
