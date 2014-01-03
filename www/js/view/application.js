define("view/application",
       ["bootstrap/collapse", "bootstrap/modal", "bootstrap/transition", "jquery", "keys", "view",
        "view/header", "tmpl/exception", "tmpl/sidebar", "tmpl/skeleton"],
       function(BootstrapCollapse, BootstrapModal, BootstrapTransition, $, Keys, View,
                HeaderView, MissionsSidebarView, SlavesSidebarView, tmpl) {

    "use strict";

    return View.extend({

        initialize: function() {

            this.exception = null;

            this.application.notificationBus.subscribe("server-push:exception", function(data) {
                this.exception = data;

                this.$(".js-exception").html(tmpl.exception(data));
            }, this);
        },

        events: {
            "click .action-home": function() {
                this.application.navigateTo("");
            },
            "click .action-mission": function(event) {
                var id = this.targetData(event, "mission-id");
                this.application.navigateTo("mission/" + id);
            },
            "click .action-show-stacktrace": function() {
                var $pre = $("<pre>").text(this.exception.stacktrace);
                this.$(".action-show-stacktrace").replaceWith($pre);
            },
            "click .action-start-mission": function(event) {
                var id = this.targetData(event, "mission-id");
                this.application.missions.get(id).start();
                return false;
            },
            "click [data-toggle='offcanvas']": function() {
                $(".row-offcanvas").toggleClass("active");
            },
            "keypress": "_onKeyPress",
            "keyup": "_onKeyUp"
        },

        render: function() {

            this.$el.html(tmpl.skeleton());

            var header = new HeaderView(this);
            this.$(".js-header").html(header.render());

            this.$(".js-sidebar").html(tmpl.sidebar());

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
