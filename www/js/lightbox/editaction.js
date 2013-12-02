define("lightbox/editaction",
       ["i18n", "laces", "lightbox", "tmpl/editaction"],
       function(i18n, Laces, Lightbox, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var action;
            if (options.action) {
                action = new Laces.Object({
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

            this.resolve(this.action);
        }

    });

});
