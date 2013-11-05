define("view/application",
       ["bootstrap/collapse", "bootstrap/modal", "bootstrap/transition", "jquery", "keys", "view",
        "view/navbar", "view/sidebar", "tmpl/skeleton"],
       function(BootstrapCollapse, BootstrapModal, BootstrapTransition, $, Keys, View, NavbarView,
                SidebarView, tmpl) {

    "use strict";

    return View.extend({

        initialize: function() {
        },

        events: {
            "click .action-home": function() {
                this.application.navigateTo("/");
            },
            "click [data-toggle='offcanvas']": function() {
                $(".row-offcanvas").toggleClass("active");
            },
            "keypress": "_onKeyPress",
            "keyup": "_onKeyUp"
        },

        render: function() {

            this.$el.html(tmpl.skeleton());

            var navbar = new NavbarView(this);
            this.$(".js-navbar").html(navbar.render());

            var sidebar = new SidebarView(this);
            this.$(".js-sidebar").html(sidebar.render());

            return this.$el;
        },

        _onKeyPress: function(event) {

            var lightbox = this.application.lightboxManager.getCurrentLightbox();
            if (lightbox) {
                lightbox.handleKeyPress(event);
            }
        },

        _onKeyUp: function(event) {

            event.preventDefault();

            var lightbox = this.application.lightboxManager.getCurrentLightbox();
            if (lightbox) {
                lightbox.handleKeyUp(event);
            } else {
                if (event.keyCode === Keys.ESCAPE) {
                    if ($.isInputElement(event.target)) {
                        $(event.target).blur();
                    }
                }
            }
        }

    });

});
