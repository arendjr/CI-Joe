define("lightbox",
       ["i18n", "jquery", "keys", "lodash", "view", "tmpl/lightbox", "tmpl/lightboxbuttons"],
       function(i18n, $, Keys, _, View, tmpl) {

    "use strict";

    /**
     * Base class for lightboxes.
     */
    return View.extend({

        constructor: function(context, options) {

            options = options || {};

            /**
             * Buttons to display in the lightbox footer.
             */
            this.buttons = [];

            /**
             * Context from which the lightbox was opened. Used for resolving and rejecting the
             * lightbox's deferred object.
             */
            this.context = options.context;

            /**
             * The view that is inserted into the lightbox by the renderContent() method. Setting
             * the content view is optional; custom content can be rendered by overriding the
             * renderContent() method.
             *
             * Use setContentView() to set the inner view.
             */
            this.contentView = null;

            /**
             * A $.Deferred object that can be resolved or rejected to close the lightbox. The
             * caller who opened the lightbox (through Application.openLightbox()) will receive the
             * result of the resolve()/reject() call.
             *
             * Note: Rather than resolving or rejecting this object directly, use the resolve() or
             *       reject() method of the lightbox.
             */
            this.deferred = new $.Deferred();

            /**
             * Boolean indicating whether the lightbox has been opened by navigating to its path. If
             * this is the case then closing the lightbox should result in a back navigation in the
             * history.
             *
             * This property is set by LightboxManager.openLightbox().
             */
            this.openedThroughNavigation = false;

            /**
             * Boolean indicating whether the lightbox has been resolved.
             */
            this.resolved = false;

            /**
             * The display title of the lightbox.
             */
            this.title = "";

            /**
             * Template to use for rendering the skeleton of the lightbox.
             */
            this.template = tmpl.lightbox;

            View.call(this, context, options);

            this.application.notificationBus.signal("lightbox:open", this);
        },

        events: {
            "click .action-close": "requestClose",
            "hidden.bs.modal": "_resolveDeferred"
        },

        /**
         * This method is called when a key press event is registered while the lightbox is open.
         *
         * @param event The event object.
         */
        handleKeyPress: function(/*event*/) {
        },

        /**
         * This method is called when a key up event is registered while the lightbox is open.
         *
         * @param event The event object.
         */
        handleKeyUp: function(event) {

            if (event.keyCode === Keys.ESCAPE) {
                if ($.isInputElement(event.target)) {
                    $(event.target).blur();
                } else {
                    this.requestClose();
                }
            }
        },

        /**
         * Rejects the lightbox's deferred object. This will close the lightbox.
         */
        reject: function() {

            this.$el.modal("hide");
        },

        remove: function() {

            if (this.contentView) {
                this.contentView.remove();
                this.contentView = null;
            }

            this.application.notificationBus.signal("lightbox:close", this);

            View.prototype.remove.call(this);
        },

        render: function() {

            var buttons = _.map(this.buttons, function(button) {
                return {
                    label: button.label,
                    extraAttr: _.map(button.data, function(value, key) {
                        return " " + _.escape(key) + "=\"" + _.escape(value) + "\"";
                    }).join(""),
                    extraClass: (button.extraClass ? " " + button.extraClass : "")
                };
            });

            this.setElement(this.template({ buttons: buttons, title: this.title }));

            this.renderContent();

            this.$el.modal({ backdrop: true });

            return this.$el;
        },

        /**
         * Renders the content of the lightbox. The rendered content should be inserted into the
         * ".js-content" element.
         *
         * The default implementation just renders and inserts the content view.
         */
        renderContent: function() {

            if (this.contentView) {
                this.$(".js-content").html(this.contentView.render());
            }
        },

        reparent: function() {
        },

        /**
         * Requests the lightbox to close.
         *
         * Overwrite this method if a prompt should be given before closing, for example.
         */
        requestClose: function() {

            this.reject();
        },

        /**
         * Resolves the lightbox's deferred object. This will close the lightbox.
         */
        resolve: function() {

            this.resolved = true;

            this.$el.modal("hide");
        },

        /**
         * Sets the content view. The content view will be owned by the lightbox.
         */
        setContentView: function(contentView) {

            if (this.contentView) {
                this.contentView.remove();
                this.contentView = null;
            }

            this.contentView = contentView;
        },

        _resolveDeferred: function() {

            if (this.resolved) {
                this.deferred.resolveWith(this.context, arguments);
            } else {
                this.deferred.rejectWith(this.context, arguments);
            }
        }

    });

});
