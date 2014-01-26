define("view/settings", ["view", "tmpl/settings"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.settings());
        }

    });

});
