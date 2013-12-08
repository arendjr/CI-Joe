define("router", ["lodash", "setzerotimeout"], function(_, setZeroTimeout, undefined) {

    "use strict";

    function Router(navigationController) {

        _.each(this.lightboxes, function(name, path) {
            this.routes[path + "(?:query)"] = function() {
                this.openPage("MainOverview", undefined, path);
            };
        }, this);

        this.basePath = navigationController.application.basePath;

        this.controller = navigationController;

        var root = "/";
        if (navigationController.application.baseUrl.indexOf("/build") > -1) {
            root = "/build";
        }

        var self = this;
        setZeroTimeout(function() {
            window.addEventListener("popstate", _.bind(self._onStatePopped, self));

            var routeFound = self._activateRoute();
            if (!routeFound) {
                self.controller.application.notificationBus.signal("router:noRoute");
            }
        }, 0);
    }

    _.extend(Router.prototype, {

        getCurrentPagePath: function() {

            var currentPath = "/" + location.pathname.substr(this.basePath.length);
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

        navigate: function(path) {

            history.pushState({}, "", this.basePath + path);
            this._activateRoute();
        },

        routes: {
            "": function(path) { this.openPage("MainOverview", undefined, path); },
            "dashboard(/:path)": function(path) { this.openPage("Dashboard", undefined, path); },
            "mission/:id(/:path)": function(id, path) { this.openPage("Mission", id, path); }
        },

        lightboxes: {},

        _activateRoute: function() {

            function routeToRegExp(route) {
                var optionalParam = /\((.*?)\)/g;
                var namedParam    = /(\(\?)?:\w+/g;
                var splatParam    = /\*\w+/g;
                var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

                route = route
                    .replace(escapeRegExp, "\\$&")
                    .replace(optionalParam, "(?:$1)?")
                    .replace(namedParam, function(match, optional) {
                        return optional ? match : '([^\/]+)';
                    })
                    .replace(splatParam, "(.*?)");
                return new RegExp("^" + route + "$");
            }

            var path = location.pathname.substr(this.basePath.length);

            var params;
            var route = _.find(this.routes, function(handler, route) {
                var regex = routeToRegExp(route);
                if (regex.test(path)) {
                    params = _.map(regex.exec(path).slice(1), function(param) {
                        return param ? decodeURIComponent(param) : null;
                    });
                    return true;
                } else {
                    return false;
                }
            });

            if (route) {
                route.apply(this, params);
            }

            return !!route;
        },

        _onStatePopped: function() {

            this._activateRoute();
        }

    });

    return Router;

});
