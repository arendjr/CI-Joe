define("view/headquarters", ["view", "tmpl/headquarters"], function(View, tmpl) {

    "use strict";

    return View.extend({

        render: function() {

            return this.$el.html(tmpl.headquarters());
        }

    });

});
