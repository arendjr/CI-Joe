define("router",
       ["backbone", "setzerotimeout", "underscore"],
       function(Backbone, setZeroTimeout, _, undefined) {

    "use strict";

    return Backbone.Router.extend({

        constructor: function(navigationController, options) {

            _.each(this.lightboxes, function(name, path) {
                this.routes[path + "(?:query)"] = function() {
                    this.openPage("Overview", undefined, path);
                };
            }, this);

            Backbone.Router.call(this, options);

            this.basePath = navigationController.application.basePath;

            this.controller = navigationController;

            this.notificationBus = navigationController.application.notificationBus;

            var root = "/";
            if (navigationController.application.baseUrl.indexOf("/build") > -1) {
                root = "/build";
            }

            var self = this;
            setZeroTimeout(function() {
                var routeFound = true;
                if (!Backbone.History.started) {
                    routeFound = Backbone.history.start({ pushState: true, root: root });
                    Backbone.History.started = true;
                }

                if (!routeFound) {
                    self.notificationBus.signal("router:noRoute");
                }
            }, 0);
        },

        getCurrentPagePath: function() {

            var currentPath = "/" + window.location.pathname.substr(this.basePath.length);
            _.each(this.lightboxes, function(name, path) {
                if (currentPath.slice(-path.length - 1) === "/" + path) {
                    currentPath = currentPath.substr(0, currentPath.length - path.length - 1);
                }
            });
            return currentPath.substr(1);
        },

        openPage: function(type, id, path) {

            this.controller.openPage(type, id, path);
        },

        navigate: function(path, options) {

            options = options || {};

            if (!Backbone.History.started && options.trigger) {
                history.pushState({}, "", path);
            } else {
                Backbone.Router.prototype.navigate.call(this, path, options);
            }
        },

        routes: {
            "": function(path) { this.openPage("MainOverview", undefined, path); },
            "dashboard(/:path)": function(path) { this.openPage("Dashboard", undefined, path); }
        },

        lightboxes: {}

    });

});
