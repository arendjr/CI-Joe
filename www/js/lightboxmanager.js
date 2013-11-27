define("lightboxmanager",
       ["jquery", "lightboxfactory", "lightbox/confirm", "lodash"],
       function($, LightboxFactory, ConfirmLightbox, _) {

    "use strict";

    /**
     * Lightbox Manager.
     *
     * Keeps track of all open lightboxes, makes sure they are opened correctly and cleans up after
     * them when they are closed.
     */
    function LightboxManager(application, options) {

        this.application = application;

        this.$el = options.$el;
        this.$mainEl = options.$mainEl;

        this._lightboxFactory = new LightboxFactory(application);

        this._openLightboxes = [];

        this._$backdrop = null;

        application.notificationBus.subscribe("lightbox:close", this._onLightboxClosed, this);
    }

    _.extend(LightboxManager.prototype, {

        /**
         * Closes the currently open lightbox, if there is one.
         */
        closeCurrentLightbox: function() {

            if (this._openLightboxes.length > 0) {
                var lightbox = this._openLightboxes[this._openLightboxes.length - 1];
                if (lightbox.mayRemove) {
                    if (lightbox.openedThroughNavigation) {
                        this.application.navigation.goBack();
                    } else {
                        lightbox.remove();
                    }
                } else {
                    lightbox.requestClose();
                }
                return true;
            } else {
                return false;
            }
        },

        /**
         * Presents a modal dialog asking the user to confirm a question or statement.
         *
         * @param text The question or statement presented to the user.
         * @param options Optional options object. Possible properties are:
         *                context - Context in which to execute the promise callbacks.
         *                title - The title for the confirm dialog.
         *                confirmLabel - Label of the confirm button (default: "OK").
         *                cancelLabel - Label of the cancel button (default: "Cancel").
         *
         * @return A Promise object that gets fulfilled when the dialog is confirmed, or rejected if
         *         the dialog is cancelled.
         */
        confirm: function(text, options) {

            options = options ? _.clone(options) : {};

            var context = options.context;
            delete options.context;

            var deferred = new $.Deferred();

            options.text = text.toString();
            options.confirm = function() {
                deferred.resolveWith(context);
            };
            options.cancel = function() {
                deferred.rejectWith(context);
            };

            var lightbox = new ConfirmLightbox(this.application, options);
            this.openLightbox(lightbox);
            deferred.always(function() {
                lightbox.remove();
            });

            return deferred.promise();
        },

        /**
         * Returns the currently open lightbox, if there is one.
         */
        getCurrentLightbox: function() {

            if (this._openLightboxes.length > 0) {
                return this._openLightboxes[this._openLightboxes.length - 1];
            } else {
                return null;
            }
        },

        /**
         * Opens a new lightbox.
         *
         * Be aware if you use this method directly, the resulting lightbox will not be a part of
         * the navigatable history of the application. If you want the lightbox to show up in the
         * history, use navigateToSubpath() instead.
         *
         * @param lightbox Instance of a lightbox view or name of a lightbox class.
         * @param options Optional options object that's passed to the lightbox. Only used when the
         *                first parameter is a string.
         *
         * @return A $.Deferred object that's resolved when the lightbox is resolved, and rejected
         *         when the lightbox is rejected.
         */
        openLightbox: function(lightbox, options) {

            if (typeof lightbox === "string") {
                lightbox = this._lightboxFactory.create(lightbox, options);
            }

            this._openLightboxes.push(lightbox);

            this.$el.html(lightbox.render());

            var self = this;
            return lightbox.deferred.promise().always(function() {
                if (lightbox.openedThroughNavigation) {
                    self.application.navigation.goBack();
                } else {
                    lightbox.remove();
                }
            });
        },

        _onLightboxClosed: function(lightbox) {

            var topLightbox = this._openLightboxes.pop();
            if (topLightbox !== lightbox) {
                var index = this._openLightboxes.indexOf(lightbox);
                if (index > -1) {
                    this._openLightboxes.splice(index, 1);
                }
                this._openLightboxes.push(topLightbox);
            }

            if (this._openLightboxes.length > 0 && !lightbox.openedThroughNavigation) {
                topLightbox = this._openLightboxes[this._openLightboxes.length - 1];
                if (topLightbox) {
                    this.$el.html(topLightbox.render());
                }
            }
        }

    });

    return LightboxManager;

});
