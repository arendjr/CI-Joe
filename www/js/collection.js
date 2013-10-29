define("collection", ["jquery.util", "laces", "model", "lodash"], function($, Laces, Model, _) {

    "use strict";

    /**
     * Base class for all collections.
     */
    var Collection = Model.extend({

        /**
         * Class to use for wrapping the collection's models.
         */
        ModelClass: null,

        constructor: function() {

            Model.prototype.constructor.apply(this, arguments);

            /**
             * The number of models in the collection.
             */
            this.length = 0;

            /**
             * The limit to use during fetching.
             */
            this.limit = 10;

            /**
             * The collection's models.
             */
            this.models = new Laces.Array();
            this.models.on("add remove", _.bind(this._updateLength, this));

            /**
             * The offset to use during fetching.
             */
            this.offset = 10;
        },

        /**
         * Adds a model to the collection. Does nothing if a model with the same ID is already
         * in the collection.
         *
         * @param model A Model instance, or a set of attributes that will be wrapped in a model.
         */
        add: function(model) {

            if (model instanceof this.ModelClass) {
                // good
            } else {
                model = new this.ModelClass(this.application, model);
            }

            if (!this.any({ id: model.id })) {
                this.models.push(model);
            }
        },

        /**
         * Returns the model at the specified index.
         */
        at: function(index) {

            if (index >= 0 && index < this.length) {
                return this.models[index];
            } else {
                throw new RangeError("Invalid index: " + index);
            }
        },

        defaults: {
            numItems: 0
        },

        fetch: function() {

            var self = this;
            var promise = Model.prototype.fetch.apply(this, arguments);
            promise.then(function() {
                _.each(self.items, function(item) {
                    var model = new this.ModelClass(this.application, item);
                    this.models.push(model);
                }, self);
                self.remove("items");
            });
            return promise;
        },

        /**
         * Stops observing an event.
         *
         * @param event Name of the observed event. May be a space-separated list of event names.
         * @param callback Callback function that was executed when the event fired.
         */
        off: function(event, callback) {

            this.models.off(event, callback);
        },

        /**
         * Starts observing an event.
         *
         * @param event Name of the event to observe. May be a space-separated list of event names.
         * @param callback Callback function to execute when the event fires.
         */
        on: function(event, callback) {

            this.models.on(event, callback);
        },

        /**
         * Removes a model from the collection. Does nothing if the model is not found in the
         * collection.
         *
         * @param model A Model instance, or a model ID.
         */
        remove: function(model) {

            var index;
            if (model instanceof this.ModelClass) {
                index = this.indexOf(model);
            } else {
                index = this.findIndex({ id: model });
            }

            if (index > -1) {
                this.models.remove(index);
            }
        },

        url: function() {

            var url = Model.prototype.url.call(this);
            return url + "?" + $.param({ limit: this.limit, offset: this.offset });
        },

        _updateLength: function() {

            this.length = this.models.length;
        }
    });

    _.each(["any", "each", "filter", "find", "findIndex", "indexOf", "reject"], function(func) {
        Collection.prototype[func] = function(callback, context) {
            return _[func](this.models, callback, context || this);
        };
    });

    return Collection;

});
