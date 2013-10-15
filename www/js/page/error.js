define("page/error", ["page", "view/error"], function(Page, ErrorView) {

    "use strict";

    return Page.extend({

        initialize: function() {

            this.error = null;
        },

        createRootView: function() {

            return new ErrorView(this, { error: this.error });
        },

        setError: function(error) {

            this.error = error;
        }

    });

});
