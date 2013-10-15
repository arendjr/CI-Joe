define("view/navbar", ["view", "tmpl/navbar"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.navbar());
        }

    });

});
