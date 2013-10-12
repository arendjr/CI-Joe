define("errors", ["i18n", "lodash"], function(i18n, _) {

    "use strict";

    return {

        init: function() {

            this.Replies = {};

            _.each([

                [0, "Success", i18n("Success")],
                [1, "Invalid Request", i18n("Communication problem with C.I. Joe")],
                [2, "Invalid Token", i18n("Your login session is not recognized (anymore)")],
                [3, "Invalid Data", i18n("Some fields were missing or incorrectly filled in")],
                [4, "Not Found", i18n("The requested data did not exist on the server (anymore)")],
                [5, "Server Error", i18n("The server encountered an unexpected error")],
                [1000, "No Connection", i18n("Communication with C.I. Joe has been lost")]

            ], function(error) {
                (function(code, status, message) {
                    var constant = status.toUpperCase().replace(/ /g, "_");

                    this[code] = message.toString();
                    this[constant] = code;
                    this.Replies[constant] = { code: code, message: status };
                }).apply(this, error);
            }, this);
        }

    };

});
