define("view/error", ["underscore", "view"], function(_, View) {

    "use strict";

    return View.extend({

        render: function() {

            return _.escape(this.options.error.message);
        }

    });

});
