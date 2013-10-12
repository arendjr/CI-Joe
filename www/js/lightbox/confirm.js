define("lightbox/confirm",
       ["i18n", "lightbox", "lodash", "tmpl/confirm"],
       function(i18n, Lightbox, _, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            this.extraClass = "small";
            this.title = options.title || "";

            this.mayRemove = false;
        },

        events: _.extend({}, Lightbox.prototype.events, {
            "click .js-confirm-button": "_confirm",
            "click .js-cancel-button": "_cancel"
        }),

        renderContent: function() {

            var text = _.escape(this.options.text).replace(/\n/g, "<br>")
                                                           .replace(/&lt;b&gt;/gm, "<b>")
                                                           .replace(/&lt;\/b&gt;/gm, "</b>");

            var data = {
                text: text,
                confirmLabel: this.options.confirmLabel || i18n("OK"),
                cancelLabel: this.options.cancelLabel || i18n("Cancel")
            };

            this.$(".js-content").html(tmpl.confirm(data));
        },

        requestClose: function() {

            this._cancel();
        },

        _cancel: function() {

            this.options.cancel.call(this.options.context);
        },

        _confirm: function() {

            this.options.confirm.call(this.options.context);
        }

    });

});
