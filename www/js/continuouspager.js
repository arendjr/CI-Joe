define("continuouspager",
       ["jquery.util", "laces.tie", "lodash", "view", "tmpl/continuouspager"],
       function($, Laces, _, View, tmpl) {

    "use strict";

    /**
     * Base class for continuous pagers.
     */
    return View.extend({

        constructor: function() {

            /**
             * The collection to render in the pager.
             */
            this.collection = null;

            /**
             * Template to render a placeholder when the pager is empty.
             *
             * As alternative to setting this property, you may consider overwriting renderEmpty()
             * entirely.
             */
            this.emptyTemplate = null;

            /**
             * Template function to render individual items.
             *
             * As alternative to setting this property, you may consider overwriting renderItem()
             * entirely.
             */
            this.itemTemplate = null;

            /**
             * Template function to render the pager's skeleton.
             */
            this.template = tmpl.continuouspager;

            View.apply(this, arguments);

            this.subscribe(this.collection, "add", "_itemAdded");
            this.subscribe(this.collection, "remove", "_itemRemoved");
            this.subscribe(this.collection, "fetch:start", "_fetchStarted");
            this.subscribe(this.collection, "fetch:finish", "_fetchFinished");
        },

        /**
         * Removes a rendered item.
         */
        removeItem: function($el/*, model*/) {

            $el.remove();
        },

        render: function() {

            this.$el.html(this.template());

            if (this.collection.length) {
                this._itemAdded({ index: 0, elements: this.collection.models });
            } else if (this.collection.fetchInProgress) {
                this._fetchStarted();
            } else {
                this._append(this.renderEmpty());
            }

            return this.$el;
        },

        /**
         * Renders a placeholder that should be used when the pager is empty.
         *
         * The default implementation renders the emptyTemplate and returns it.
         *
         * @return jQuery container of the rendered placeholder.
         */
        renderEmpty: function() {

            return $(_.result(this, "emptyTemplate")).addClass("js-empty-placeholder");
        },

        /**
         * Renders an individual item.
         *
         * The default implementation uses the itemTemplate property, creates a Laces Tie between
         * the template and the model and renders it into a jQuery container. The data-item-id
         * attribute is always added to the rendered template.
         *
         * @param model Model to use for rendering the item.
         *
         * @return jQuery container of the rendered item.
         */
        renderItem: function(model) {

            var tie = new Laces.Tie(model, this.itemTemplate);
            var $el = $(tie.render()).children();

            $el.attr("data-item-id", model.id);

            return $el;
        },

        _append: function($el, $after) {

            $after = $after || this.$(".js-item-header");
            if ($after.length) {
                $el.insertAfter($after);
            } else {
                this.$(".js-items").append($el);
            }
        },

        _fetchFinished: function() {

            //this.$(".js-spinner").remove();

            if (!this.collection.length) {
                this._append(this.renderEmpty());
            }
        },

        _fetchStarted: function() {

            //this._append($("<div class=\"js-spinner\">").startLoader());
        },

        _itemAdded: function(event) {

            var $container = this.$(".js-items");
            var $items = $container.children().filter("[data-item-id]");
            if (event.index > 0 && event.index <= $items.length) {
                _.each(event.elements, function(model) {
                    this.renderItem(model).insertAfter($items.eq(event.index - 1));
                }, this);
            } else {
                $(".js-empty-placeholder").remove();
                var $previous = this.$(".js-item-header");
                _.each(event.elements, function(model) {
                    var $item = this.renderItem(model);
                    this._append($item, $previous);
                    $previous = $item;
                }, this);
            }
        },

        _itemRemoved: function(event) {

            _.each(event.elements, function(model) {
                this.removeItem(this.$("[data-item-id=" + $.jsEscape(model.id) + "]"), model);
            }, this);

            if (!this.collection.length) {
                this._append(this.renderEmpty());
            }
        }

    });

});
