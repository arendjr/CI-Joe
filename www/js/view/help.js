define("view/help", ["view", "tmpl/help"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.help());
        }

    });

});
