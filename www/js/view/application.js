define("view/application", ["jquery", "view", "tmpl/skeleton"], function($, View, tmpl) {

    "use strict";

    return View.extend({

        el: $("body"),

        initialize: function() {
        },

        events: {
        },

        render: function() {

            return this.$el.html(tmpl.skeleton());
        }

    });

});
