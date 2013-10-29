define("continuouspager",
       ["jquery.util", "lodash", "view", "tmpl/continuouspager"],
       function($, _, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.collection = options.collection;

            this.template = tmpl.continuouspager;

            this.subscribe(this.collection, "add", "_itemAdded");
            this.subscribe(this.collection, "remove", "_itemRemoved");
        },

        /**
         * Tag name of the element to use wrapping individual items.
         */
        itemTagName: "div",

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
         * Calls renderItemContent().
         */
        renderItem: function(model) {

            var $el = $("<" + this.itemTagName + ">");
            $el.attr("data-item-id", model.id);

            this.renderItemContent($el, model);

            return $el;
        },

        /**
         * Renders the contents of an individual item.
         */
        renderItemContent: function(/*$el, model*/) {
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
