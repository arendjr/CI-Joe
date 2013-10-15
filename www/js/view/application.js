define("view/application",
       ["bootstrap/collapse", "bootstrap/transition", "jquery", "view", "view/navbar",
        "view/sidebar", "tmpl/skeleton"],
       function(Collapse, Transition, $, View, NavbarView,
                SidebarView, tmpl) {

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

            this.$el.html(tmpl.skeleton());

            var navbar = new NavbarView(this);
            this.$(".js-navbar").html(navbar.render());

            var sidebar = new SidebarView(this);
            this.$(".js-sidebar").html(sidebar.render());

            return this.$el;
        }

    });

});
