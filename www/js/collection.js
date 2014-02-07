define("collection", ["jquery.util", "laces", "model", "lodash"], function($, Laces, Model, _) {

    "use strict";

    /**
     * Base class for all collections.
     */
    var Collection = Model.extend({

        constructor: function() {

            Model.apply(this, arguments);

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
            this.offset = 0;

            this.subscribe("server-push:" + this.type + ":add", this._onServerAdd);
            this.subscribe("server-push:" + this.type + ":remove", this._onServerRemove);
            this.subscribe("server-push:" + this.type + ":update", this._onServerUpdate);
        },

        /**
         * Class to use for wrapping the collection's models.
         */
        ModelClass: null,

        /**
         * Adds a model to the collection. Does nothing if a model with the same ID is already
         * in the collection.
         *
         * @param model A Model instance, or a set of attributes that will be wrapped in a model.
         */
        add: function(model) {

            if (!this.any({ id: model.id })) {
                if (model instanceof this.ModelClass) {
                    // good
                } else {
                    model = new this.ModelClass(this.application, model);
                }

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
            self.models.fire("fetch:start");

            var promise = Model.prototype.fetch.apply(this, arguments);
            promise.then(function() {
                _.each(self.items, function(item) {
                    var model = new this.ModelClass(this.application, item);
                    this.models.push(model);
                }, self);
                self.unset("items");
            }).always(function() {
                self.models.fire("fetch:finish");
            });

            return promise;
        },

        /**
         * Returns an item by ID.
         */
        get: function(id) {

            return this.find({ id: id });
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
         * @param options Optional options object. May contain the following properties:
         *                context - Context to use for the callback function.
         *                initialFire - Boolean determining whether the callback should be initially
         *                              called.
         */
        on: function(event, callback, options) {

            this.models.on(event, callback, options);
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

        _onServerAdd: function(data) {

            this.add(data[this.ModelClass.prototype.type]);
        },

        _onServerRemove: function(data) {

            var model = this.get(data.id);
            if (model) {
                this.remove(model);

                model.destruct();
            }
        },

        _onServerUpdate: function(data) {

            var attrs = data[this.ModelClass.prototype.type];
            var model = this.get(attrs.id);
            if (model) {
                model.set(_.omit(attrs, "id"));
            }
        },

        _updateLength: function() {

            this.length = this.models.length;
        }
    });

    // mixin useful LoDash methods
    _.each(["any", "each", "filter", "find", "findIndex", "map", "reject", "without"],
           function(func) {
        Collection.prototype[func] = function(callback, context) {
            return _[func](this.models, callback, context || this);
        };
    });

    // mixin useful Array methods
    _.each(["indexOf", "push", "shift", "slice", "splice", "unshift"], function(func) {
        Collection.prototype[func] = function() {
            return this.models[func].apply(this.models, arguments);
        };
    });

    return Collection;

});
