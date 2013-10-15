define("page", ["extend", "jquery", "lodash"], function(extend, $, _) {

    "use strict";

    /**
     * Base class for all pages.
     *
     * @param application Reference to the Application object.
     * @param type Type of the page.
     * @param id EID of the page (optional).
     */
    function Page(application, type, id) {

        /**
         * Reference to the Application object.
         */
        this.application = application;

        /**
         * Type of the page.
         */
        this.type = type;

        /**
         * EID of the page (optional).
         */
        this.id = id;

        /**
         * jQuery container for the element containing the page. Will be available after the first
         * call to show().
         */
        this.$el = null;

        /**
         * Relative path currently shown. Should be set by show().
         */
        this.path = "";

        this._lightbox = null;

        this._pathsStack = [];

        this._rootView = null;

        if (this.initialize) {
            this.initialize(application, type, id);
        }
    }

    Page.extend = extend;

    _.extend(Page.prototype, {

        /**
         * Returns whether it's possible to navigate back in the history within this particular
         * page.
         */
        canGoBack: function() {

            return this._pathsStack.length > 1;
        },

        /**
         * Confirms the path has been shown. This method should only be called by implementations of
         * show().
         *
         * @param path Relative path of the page that was shown.
         */
        confirmDidShowPath: function(path) {

            this.path = path;
        },

        /**
         * Creates the root view of the page.
         *
         * This method should be re-implemented by every subclass. The Page class will take
         * ownership of the returned instance.
         */
        createRootView: function() {
        },

        /**
         * Destructs the entire page.
         *
         * Note: You may always assume that your page is hidden before it is destructed. Any views
         * that are destructed during hide() will no longer need to be destructed during destruct().
         */
        destruct: function() {

            this.application.notificationBus.unsubscribe("*", null, this);
        },

        /**
         * Returns the root view of the page.
         *
         * This will instantiate the root view if it doesn't exist yet, and should thus only be
         * called when the page is visible or in the process of being shown.
         */
        getRootView: function() {

            if (!this._rootView) {
                this._rootView = this.createRootView();
            }
            return this._rootView;
        },

        /**
         * Hides the page.
         *
         * Rather than re-implementing this method, subclasses are encouraged to implement
         * beforeHide() and/or afterHide() methods, if necessary. If you do insist on
         * re-implementing this method, make sure to call the base implementation to clear the root
         * view.
         */
        hide: function() {

            if (this.beforeHide) {
                this.beforeHide();
            }

            if (this._lightbox) {
                this._lightbox.remove();
                this._lightbox = null;
            }

            if (this._rootView) {
                this._rootView.remove();
                this._rootView = null;
            }

            if (this.afterHide) {
                this.afterHide();
            }
        },

        /**
         * Returns whether the page is currently visible.
         */
        isVisible: function() {

            return !!this._rootView;
        },

        /**
         * Set to true to make the page publicly accessible, i.e. without being logged in.
         */
        public: false,

        /**
         * Shows the page.
         *
         * @param $el jQuery container for the element in which to show the page.
         * @param path Relative path of the page to show.
         *
         * This method may be called multiple times without calling hide() in between, provided the
         * path is different.
         *
         * Rather than re-implementing this method, subclasses are encouraged to implement
         * beforeShow() and/or afterShow() methods which receive the same arguments as this method.
         * If you do insist on re-implementing this method, make sure to call confirmDidShowPath().
         */
        show: function($el, path) {

            if (this.beforeShow) {
                this.beforeShow($el, path);
            }

            var isRendered = !!this._rootView;
            if (isRendered) {
                this._rootView.delegateEvents();
            } else {
                this._rootView = this.getRootView();
            }

            if (!isRendered || !path) {
                this.$el = this._rootView.render();
                $el.html(this.$el);
            }

            this.confirmDidShowPath(path);

            this.updateHeight();

            if (this.afterShow) {
                this.afterShow($el, path);
            }

            this._openLightboxForPath(path);
        },

        /**
         * Updates the height of the page. This method should be called after the window is resized
         * to avoid the page having the wrong height.
         */
        updateHeight: function() {

            // little hack to make the height work with Jeffrey's CSS
            var height = ($(window).height() - 41) + "px";
            $(".page").css("min-height", height);
            $(".page iframe").css("height", height);
        },

        _openLightboxForPath: function(path) {

            path = path || "";

            var index = path.indexOf("?");
            if (index > -1) {
                path = path.substr(0, index);
            }

            var lightbox = this.application.navigation.createLightboxForPath(path);
            if (this.public && lightbox && !lightbox.public) {
                return;
            }

            if (this._lightbox) {
                this._lightbox.remove();
            }
            this._lightbox = lightbox;
            if (lightbox) {
                this.$el.find("input, textarea").attr("tabindex", "-1");

                this.application.openLightbox(lightbox, { inHistory: true });
            }

            index = this._pathsStack.indexOf(path);
            if (index > -1) {
                this._pathsStack.splice(index + 1);
            } else {
                this._pathsStack.push(path);
            }
        }

    });

    return Page;

});
