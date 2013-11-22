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
        },

        /**
         * Removes a rendered item.
         */
        removeItem: function($el/*, model*/) {

            $el.remove();
        },

        render: function() {

            this.$el.html(this.template());

            var $items = this.$(".js-items");
            this.collection.each(function(model) {
                $items.append(this.renderItem(model));
            }, this);

            return this.$el;
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

        _itemAdded: function(event) {

            var $container = this.$(".js-items");
            var $items = $container.children();
            if ($items.length > event.index) {
                _.each(event.elements, function(model) {
                    this.renderItem(model).insertBefore($items.at(event.index));
                }, this);
            } else {
                _.each(event.elements, function(model) {
                    this.renderItem(model).appendTo($container);
                }, this);
            }
        },

        _itemRemoved: function(event) {

            _.each(event.elements, function(model) {
                this.removeItem(this.$("[data-item-id=" + $.jsEscape(model.id) + "]"), model);
            }, this);
        }

    });

});
