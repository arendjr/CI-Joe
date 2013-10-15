define("view/application",
       ["bootstrap/collapse", "bootstrap/transition", "jquery", "view", "tmpl/skeleton"],
       function(Collapse, Transition, $, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function() {
        },

        events: {
            "click [data-toggle='offcanvas']": function() {
                $(".row-offcanvas").toggleClass("active");
            }
        },

        render: function() {

            return this.$el.html(tmpl.skeleton());
        }

    });

});
