define("view/sidebar", ["view", "tmpl/sidebar"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.sidebar());
        }

    });

});
