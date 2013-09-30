define("feedbackticker",
       ["errors", "i18n", "jquery", "jquery.pnotify", "underscore"],
       function(Errors, i18n, $, $pnotify, _) {

    "use strict";

    function FeedbackTicker() {
    }

    _.extend(FeedbackTicker.prototype, {

        /**
         * Shows an error message.
         *
         * @param message Error message (optional).
         * @param error Error object containing code and message properties (optional).
         */
        showError: function(message, error) {

            if (error) {
                message = message + ": " + Errors[error.code];
            } else {
                if (message) {
                    if (message.code) {
                        error = message;
                        message = Errors[error.code];
                    } else {
                        error = { message: message };
                    }
                } else {
                    message = i18n("An error occurred");
                }
            }

            console.log("Error: " + error.message);

            this._showItem({ message: message, type: "alert" });
        },

        /**
         * Shows a notice.
         */
        showNotice: function(message) {

            this._showItem({ message: message, type: "notice" });
        },

        _showItem: function(options) {

            var message = $.richEscape(options.message.toString());

            if ($(".ui-pnotify-text").filter(function() {
                return $(this).html() === message;
            }).length === 0) {
                $.pnotify({
                    text: message,
                    type: (options.type === "alert" ? "error" : "info"),
                    sticker: false
                });
            }
        }

    });

    return FeedbackTicker;

});
