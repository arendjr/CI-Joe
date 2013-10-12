define("application",
       ["errors", "feedbackticker", "handlebars.helpers", "i18n", "jquery", "jquery.storage",
        "l10n", "lightboxmanager", "lodash", "navigationcontroller", "notificationbus", "select2",
        "view/application"],
       function(Errors, FeedbackTicker, HandlebarsHelpers, i18n, $, $storage,
                l10n, LightboxManager, _, NavigationController, NotificationBus, Select2,
                ApplicationView) {

    "use strict";

    function Application() {

        /**
         * The path portion of the base URL.
         */
        this.basePath = "";

        /**
         * The base URL of the application.
         */
        this.baseUrl = "";

        /**
         * Reference to the feedback ticker.
         */
        this.feedbackTicker = null;

        /**
         * Lightbox Manager.
         */
        this.lightboxManager = null;

        /**
         * The logged in user, if there is one.
         */
        this.loggedInUser = null;

        /**
         * The Navigation Controller.
         */
        this.navigation = null;

        /**
         * The Notification Bus.
         */
        this.notificationBus = null;

        this._urlParameters = {};

        this._view = null;

        this._init();
    }

    _.extend(Application.prototype, {

        /**
         * Presents a modal dialog asking the user to confirm a question or statement.
         *
         * This method is a convenience shortcut for LightboxManager.confirm().
         */
        confirm: function(text, options) {

            return this.lightboxManager.confirm(text, options);
        },

        /**
         * Returns the value of a parameter in the query part of the URL.
         *
         * @param name Name of the parameter to search for.
         */
        getUrlParameter: function(name) {

            if (!_.has(this._urlParameters, name)) {
                var regExp = new RegExp("[?|&]" + RegExp.escape(name) + "=" + "([^&;]*)(&|#|;|$)");
                var result = regExp.exec(location.search);
                this._urlParameters[name] = (result ?
                                             decodeURIComponent(result[1].replace(/\+/g, "%20")) :
                                             null);
            }

            return this._urlParameters[name];
        },

        /**
         * Navigates to a specific path.
         *
         * @param path The path to navigate to.
         */
        navigateTo: function(path) {

            this.navigation.navigateTo(path);
        },

        /**
         * Navigates to a subpath which will be opened in the context of the current page. This
         * method is typically used to open lightboxes.
         *
         * @param path The subpath to navigate to.
         * @param queryParams Optional object containing a query parameters map.
         */
        navigateToSubpath: function(path, queryParams) {

            _.each(queryParams, function(value, key) {
                this.setUrlParameter(key, value);
            }, this);

            this.navigation.navigateToSubpath(path, queryParams);
        },

        /**
         * Opens a new lightbox.
         *
         * Be aware if you use this method directly, the resulting lightbox will not be a part of
         * the navigatable history of the application. If you want the lightbox to show up in the
         * history, use navigateToSubpath() instead.
         *
         * This method is a convenience shortcut for LightboxManager.openLightbox().
         */
        openLightbox: function(lightbox, options) {

            return this.lightboxManager.openLightbox(lightbox, options);
        },

        /**
         * Sets the currently active locale.
         */
        setLocale: function(locale, options) {

            options = options || {};

            var deferred = new $.Deferred();

            if (locale === l10n.locale) {
                deferred.resolveWith(options.context);
            } else {
                if (!_.has(l10n.LOCALES, locale)) {
                    locale = l10n.detectLocale();
                }

                $.localStorage("lang", locale);

                // check again, because it might've become the same after detectLocale()
                if (locale === l10n.locale) {
                    deferred.resolveWith(options.context);
                    return;
                }

                $("html").attr("lang", locale);

                l10n.loadTranslation(locale, { context: this }).then(function() {
                    l10n.setLocale(locale);

                    this.notificationBus.signal("locale:change", locale);

                    deferred.resolveWith(options.context);
                });
            }

            return deferred.promise();
        },

        /**
         * Sets the value of a URL query parameter. If the parameter already existing in the URL,
         * it will be overwritten.
         *
         * @param name Name of the parameter to set.
         * @param value Value to set for the parameter.
         */
        setUrlParameter: function(name, value) {

            this._urlParameters[name] = value;
        },

        _init: function() {

            this.basePath = (location.pathname.substr(0, 7) === "/build/" ? "/build/" : "/");
            this.baseUrl = location.protocol + "//" + location.host + this.basePath;

            this.notificationBus = new NotificationBus(this);
            this.notificationBus.connect();

            this.setLocale($.localStorage("lang"), { context: this }).then(function() {
                Errors.init();

                this._localizeSelect2();

                this._view = new ApplicationView(this, { $el: $("body") });
                this._view.render();

                var $main = $(".js-main");
                var $lightboxContainer = $(".js-lightbox-container");

                this.feedbackTicker = new FeedbackTicker();

                this.lightboxManager = new LightboxManager(this, {
                    $el: $lightboxContainer,
                    $mainEl: $main
                });

                this.navigation = new NavigationController(this, $main);
            });
        },

        _localizeSelect2: function() {

            _.extend($.fn.select2.defaults, {
                formatNoMatches: function() {
                    return i18n("No matches found").toString();
                },
                formatInputTooShort: function(input, min) {
                    var n = min - input.length;
                    return i18n("Please enter %1 more character", "Please enter %1 more characters")
                           .arg(n).toString();
                },
                formatInputTooLong: function(input, max) {
                    var n = input.length - max;
                    return i18n("Please remove %1 character", "Please remove %1 characters")
                           .arg(n).toString();
                },
                formatSelectionTooBig: function(limit) {
                    return i18n("You can only select %1 item", "You can only select %1 items")
                           .arg(limit).toString();
                },
                formatLoadMore: function() {
                    return i18n("Loading more results...").toString();
                },
                formatSearching: function() {
                    return i18n("Searching...").toString();
                }
            });
        }

    });

    return Application;

});
