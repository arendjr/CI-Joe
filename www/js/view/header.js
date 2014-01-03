define("view/header", ["view", "tmpl/header"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.header());
        }

    });

});
