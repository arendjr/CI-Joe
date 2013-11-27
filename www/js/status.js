define("status", ["i18n", "lodash"], function(i18n, _) {

    "use strict";

    return {

        init: function() {

            this.Replies = {};

            _.each([

                [0, "Success", i18n("Success")],
                [-1, "Invalid Request", i18n("Communication problem with C.I. Joe")],
                [-2, "Invalid Credentials", i18n("Invalid username or password")],
                [-3, "Invalid Token", i18n("Your login session is not recognized (anymore)")],
                [-4, "Invalid Data", i18n("Some fields were missing or incorrectly filled in")],
                [-5, "Not Found", i18n("The requested data does not exist (anymore)")],
                [-6, "Server Error", i18n("The server encountered an unexpected error")],
                [-1000, "No Connection", i18n("Communication with C.I. Joe has been lost")],
                [-1001, "Unexpected Reply", i18n("Unexpected reply from the server")]

            ], function(status) {
                (function(code, status, message) {
                    var constant = status.toUpperCase().replace(/ /g, "_");

                    this[code] = message.toString();
                    this[constant] = code;
                    this.Replies[constant] = { code: code, message: status };
                }).apply(this, status);
            }, this);
        }

    };

});
