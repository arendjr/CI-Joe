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
             * Setting where the buttons should be shown. Either "top" (in the header), or "bottom"
             * (in the footer).
             */
            this.buttonPositioning = "bottom";

            /**
             * The buttons at the top of the lightbox.
             */
            this.buttons = [];

            /**
             * Context from which the lightbox was opened. Used for resolving and rejecting the
             * lightbox's deferred object.
             */
            this.context = options.context;

            /**
             * Boolean indicating whether the inner view sets a custom body. If set to true, it is
             * expected the inner view's template contains the ".modal-body" element.
             */
            this.customBody = false;

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
             * Optional CSS class to add to the lightbox.
             */
            this.extraClass = "";

            /**
             * Optional raw HTML content that will be inserted into the header of the lightbox.
             */
            this.extraHeaderHtml = "";

            /**
             * Optional raw HTML content that will be inserted right after the title of the
             * lightbox.
             */
            this.extraTitleHtml = "";

            /**
             * The view that is inserted into the lightbox by the renderContent() method. Setting
             * the content view is optional; custom content can be rendered by overriding the
             * renderContent() method.
             *
             * Use setContentView() to set the inner view.
             */
            this.contentView = null;

            /**
             * Boolean indicating whether the lightbox may be removed. If set to false, any attempt
             * to close the lightbox will go through requestClose() (which does nothing by default).
             */
            this.mayRemove = true;

            /**
             * Boolean indicating whether the lightbox has been opened by navigating to its path. If
             * this is the case then closing the lightbox should result in a back navigation in the
             * history.
             *
             * This property is set by LightboxManager.openLightbox().
             */
            this.openedThroughNavigation = false;

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

        /**
         * Adds one or more buttons.
         */
        addButtons: function(buttons) {

            _.each(buttons, function(button) {
                this.buttons.push(this._extendButton(button));
            }, this);
        },

        events: {
            "click .js-button-bar": "_onButtonClicked"
        },

        /**
         * This method is called when one of the lightbox's buttons is clicked.
         *
         * @param type The type of the button that was clicked.
         */
        handleButtonClick: function(type) {

            if (type === "close") {
                if (this.mayRemove) {
                    this.reject();
                } else {
                    this.requestClose();
                }
            }
        },

        /**
         * This method is called when a key press event is triggered while the lightbox is open.
         *
         * @param event The event object.
         */
        handleKeyPress: function(/*event*/) {
        },

        /**
         * This method is called when a key up event is triggered while the lightbox is open.
         *
         * @param event The event object.
         */
        handleKeyUp: function(event) {

            if (event.keyCode === Keys.ESCAPE) {
                if ($.isInputElement(event.target)) {
                    $(event.target).blur();
                } else if (this.mayRemove) {
                    this.reject();
                } else {
                    this.requestClose();
                }
            }
        },

        /**
         * Rejects the lightbox's deferred object. This will close the lightbox.
         */
        reject: function() {

            this.deferred.rejectWith(this.context, arguments);
        },

        render: function() {

            if (this.$el.children().length === 0) {
                var hasButtons = this.buttons.length > 0;
                this.$el.html(this.template({
                    customBody: this.customBody,
                    extraClass: this.extraClass,
                    extraHeaderHtml: this.extraHeaderHtml,
                    extraTitleHtml: this.extraTitleHtml,
                    title: this.title,
                    headerButtons: (this.buttonPositioning === "top" && hasButtons),
                    footerButtons: (this.buttonPositioning === "bottom" && hasButtons)
                }));
                this.$(".js-button-bar").html(tmpl.lightboxbuttons({ buttons: this.buttons }));

                this.renderContent();
            }

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

        remove: function() {

            if (this.contentView) {
                this.contentView.remove();
                this.contentView = null;
            }

            this.application.notificationBus.signal("lightbox:close", this);

            View.prototype.remove.call(this);
        },

        reparent: function() {
        },

        /**
         * Requests the lightbox to close. This method will only be called if mayRemove is false,
         * otherwise the lightbox will simply be removed.
         */
        requestClose: function() {
        },

        /**
         * Resolves the lightbox's deferred object. This will close the lightbox.
         */
        resolve: function() {

            this.deferred.resolveWith(this.context, arguments);
        },

        /**
         * Disables the button according to the number of views in the wizard.
         */
        setButtonEnabled: function(type, enabled) {

            this.$(".js-button-bar button[data-type='" + type + "']").setEnabled(enabled);

            _.each(this.buttons, function(button) {
                if (button.type === type) {
                    button.enabled = enabled;
                }
            });
        },

        /**
         * Handles the visibility.
         */
        setButtonVisibility: function(type, visible) {

            var display = (visible ? "inline-block" : "none");
            this.$(".js-button-bar button[data-type='" + type + "']").css("display", display);

            _.each(this.buttons, function(button) {
                if (button.type === type) {
                    button.visible = visible;
                }
            });
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

        /**
         * Toggles a button class.
         *
         * @return Whether the class has actually been toggled. Returns true if enabled is true and
         *         the class was not yet enabled, or if enabled is false and the class was already
         *         enabled, false otherwise.
         */
        toggleButtonClass: function(type, className, enabled) {

            enabled = !!enabled;

            var $button = this.$(".js-button-bar button[data-type='" + type + "']");
            var hadClass = $button.hasClass(className);
            $button.toggleClass(className, enabled);
            return hadClass !== enabled;
        },

        _extendButton: function(button) {

            return _.extend({
                positioning: "",
                label: "",
                type: "",
                visible: true,
                enabled: true,
                extraClass: ""
            }, button);
        },

        _onButtonClicked: function(event) {

            var $target = $(event.target);

            if (!$target.prop("disabled")) {
                var type = $target.data("type");
                this.handleButtonClick(type);
            }
        }

    });

});
