define("lightbox/confirm",
       ["i18n", "lightbox", "lodash"],
       function(i18n, Lightbox, _) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            var cancelLabel = options.cancelLabel || i18n("Cancel");
            var confirmLabel = options.confirmLabel || i18n("OK");
            this.buttons = [
                { label: cancelLabel, extraClass: "action-cancel" },
                { label: confirmLabel, extraClass: "action-confirm btn-primary" }
            ];

            this.extraClass = "small";
            this.title = options.title || "";

            this.mayRemove = false;
        },

        events: {
            "click .action-confirm": "resolve",
            "click .action-cancel": "reject"
        },

        renderContent: function() {

            var text = _.escape(this.options.text).replace(/\n/g, "<br>")
                                                  .replace(/&lt;b&gt;/gm, "<b>")
                                                  .replace(/&lt;\/b&gt;/gm, "</b>");

            this.$(".js-content").html(text);
        },

        requestClose: function() {

            this.reject();
        }

    });

});
