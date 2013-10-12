define("navigationcontroller",
       ["jquery", "lightboxfactory", "lodash", "pagefactory", "router"],
       function($, LightboxFactory, _, PageFactory, Router) {

    "use strict";

    var MAX_PAGES_IN_STACK = 30;

    /**
     * Navigation Controller.
     *
     * Contains the router, manages the stack of open pages, handles transitions between pages,
     * and informs the notification bus of subscriptions by the open pages.
     *
     * You should not have to create an instance of this class yourself. Instead, access it through
     * application.navigation.
     *
     * @param application Reference to the application object.
     * @param $pageEl jQuery container for the root element in which pages should be shown.
     */
    function NavigationController(application, $pageEl) {

        /**
         * Reference to the application object.
         */
        this.application = application;

        /**
         * Reference to a jQuery container for the root element in which pages are shown.
         */
        this.$pageEl = $pageEl;

        /**
         * Reference to the currently open page.
         */
        this.currentPage = null;

        this._currentPageIndex = -1;
        this._pageFactory = new PageFactory(this.application);
        this._lightboxFactory = new LightboxFactory(this.application);
        this._pages = [];

        this._router = new Router(this);
    }

    _.extend(NavigationController.prototype, {

        /**
         * Returns whether we can go back in the navigation history.
         */
        canGoBack: function() {

            return this._currentPageIndex > 0 || this._pages[0].canGoBack();
        },

        /**
         * Returns a lightbox for the given path.
         */
        createLightboxForPath: function(path) {

            if (_.has(this._router.lightboxes, path)) {
                return this._lightboxFactory.create(this._router.lightboxes[path],
                                                    this.currentPage);
            } else {
                return null;
            }
        },

        /**
         * Returns to the previous page navigated to.
         */
        goBack: function() {

            if (this.canGoBack()) {
                window.history.back();
            } else if (this.currentPage.path !== "") {
                var path = window.location.pathname;
                var barePagePath = this.currentPage.path;
                if (barePagePath.indexOf("?") > -1) {
                    barePagePath = barePagePath.substr(0, barePagePath.indexOf("?"));
                }
                var len = barePagePath.length + 1;
                if (path.slice(-len) === "/" + barePagePath) {
                    var baseLen = this.application.basePath.length;
                    path = path.slice(baseLen, path.lastIndexOf("/"));
                    this.navigateTo(path);
                }
            }
        },

        /**
         * Navigates to a specific path.
         *
         * You may choose to use the convenience method application.navigateTo() instead.
         *
         * @param path The path to navigate to.
         */
        navigateTo: function(path) {

            this._router.navigate(path);
            $("body").scrollTop(0);
        },

        /**
         * Navigates to a subpath which will be opened in the context of the current page.
         *
         * You may choose to use the convenience method application.navigateToSubpath() instead.
         *
         * @param path The subpath to navigate to.
         * @param queryParams Optional object containing a query parameters map.
         */
        navigateToSubpath: function(path, queryParams) {

            queryParams = queryParams || {};
            var query = (_.isEmpty(queryParams) ? "" : "?" + $.param(queryParams));

            var currentPath = this._router.getCurrentPagePath();
            this._router.navigate(currentPath + "/" + path + query);
        },

        /**
         * Opens a specific page.
         *
         * This method should only be called by the router.
         *
         * @param type The type of page to open.
         * @param id EID of the page to open (optional).
         * @param path Relative path of the page (optional).
         */
        openPage: function(type, id, path) {
            id = id || "";
            path = path || "";

            if (this.currentPage && this.currentPage.type === type && this.currentPage.id === id) {
                if (this.currentPage.path === path) {
                    return; // already at the right page
                } else {
                    this.currentPage.show(this.$pageEl, path);
                }
            } else {
                var pageAlreadyInHistory = false;
                for (var i = 0; !pageAlreadyInHistory && i < this._pages.length; i++) {
                    var page = this._pages[i];
                    if (page.type === type && page.id === id) {
                        this._currentPageIndex = i;
                        pageAlreadyInHistory = true;
                    }
                }

                if (this.currentPage) {
                    this.currentPage.hide();
                }

                if (pageAlreadyInHistory) {
                    this._openExistingPage(path);
                } else {
                    this._openNewPage(type, id, path);
                }

                this.currentPage = this._pages[this._currentPageIndex];
            }
        },

        /**
         * Shows the error page.
         */
        showError: function(error) {

            var page = this._pageFactory.create("Error");
            page.setError(error);
            page.show($("body"));
        },

        _openExistingPage: function(type, id, path) {

            var page = this._pages[this._currentPageIndex];
            page.show(this.$pageEl, path);
        },

        _openNewPage: function(type, id, path) {

            var numPagesInForwardHistory = this._pages.length - this._currentPageIndex - 1;
            if (numPagesInForwardHistory > 0) {
                this._deletePages(this._currentPageIndex + 1, numPagesInForwardHistory);
            }

            var page;
            if (this.application.loggedInUser || this._pageFactory.isPublic(type)) {
                page = this._pageFactory.create(type, id);
            } else {
                page = this._pageFactory.create("Login");
            }

            page.show(this.$pageEl, path);

            this._pages.push(page);

            if (this._pages.length > MAX_PAGES_IN_STACK) {
                this._deletePages(0, 1);
            } else {
                this._currentPageIndex++;
            }
        },

        _deletePages: function(index, num) {

            var deletedPages = this._pages.splice(index, num);
            _.each(deletedPages, function(page) {
                page.destruct();
            });
        }

    });

    return NavigationController;

});
