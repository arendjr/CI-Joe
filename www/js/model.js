define("model",
       ["extend", "laces", "lodash", "subscriber"],
       function(extend, Laces, _, Subscriber) {

    "use strict";

    /**
     * Base class for all models.
     *
     * @param application Application instance.
     * @param attributes Optional map of attributes to assign to the model.
     */
    function Model(application, attributes) {

        if (!application) {
            console.log("Model instantiated without Application reference");
        }

        Laces.Model.call(this);
        Subscriber.call(this, application);

        /**
         * Whether the model is currently being fetched from the server.
         */
        this.fetchInProgress = false;

        /**
         * The model's ID.
         */
        this.set("id", null);

        this.set(_.extend({}, this.defaults, attributes));

        this._fetchPromise = null;

        if (this.initialize) {
            this.initialize();
        }
    }

    Model.extend = extend;

    Model.prototype = new Laces.Model();
    Model.prototype.constructor = Model;

    _.extend(Model.prototype, {

        /**
         * Object containing default attributes.
         */
        defaults: {},

        /**
         * Destructor.
         */
        destruct: function() {

            Subscriber.prototype.destruct.call(this);
        },

        /**
         * Fetches all the model's attributes from the server.
         *
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the promise callbacks.
         */
        fetch: function(options) {

            options = options || {};

            if (this._fetchPromise) {
                return this._fetchPromise;
            }

            var url = _.result(this, "url");

            var self = this;
            var promise = this.application.api.ajax(url, { context: options.context });
            promise.then(function(data) {
                self.set(data);
                self._fetchPromise = null;
                self.fetchInProgress = false;
            });
            this._fetchPromise = promise;
            this.fetchInProgress = true;
            return promise;
        },

        /**
         * Returns whether the model is new, or in other words, hasn't been saved to the server yet.
         */
        isNew: function() {

            return !this.id;
        },

        /**
         * Plural version of the model type.
         */
        plural: "",

        /**
         * Removes the model instance from the server.
         *
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the promise callbacks.
         */
        remove: function(options) {

            options = options || {};

            var url = _.result(this, "url");
            var settings = {
                context: options.context,
                type: "DELETE"
            };

            var self = this;
            var promise = this.application.api.ajax(url, settings);
            promise.then(function() {
                self.application.notificationBus.signal("model:removed", self);
            });
            return promise;
        },

        /**
         * Saves all the model's attributes to the server.
         *
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the promise callbacks.
         */
        save: function(options) {

            options = options || {};

            var url = _.result(this, "url");
            var settings = {
                contentType: "application/json; charset=UTF-8",
                context: options.context,
                data: JSON.stringify(this.toJSON()),
                dataType: "json",
                processData: false,
                type: (this.isNew() ? "POST" : "PUT")
            };

            var self = this;
            var promise = this.application.api.ajax(url, settings);
            promise.then(function(data) {
                if (!self.id) {
                    self.id = data.id;
                }
            });
            return promise;
        },

        /**
         * Sets one or more attributes on the model.
         *
         * @param key Key of the attribute to set.
         * @param value Value of the attribute.
         *
         * Rather than setting attributes one by one, you can also pass an entire attributes object
         * instead of the key and value parameters.
         *
         * Note that because Model inherits from Laces.Model, any set attributes can also be
         * accessed directly through dot notation. (And because of this, you should avoid using
         * attribute names that collide with method names or Model's generic properties.)
         */
        set: function(key/*, value*/) {

            if (typeof key === "object") {
                _.each(key, function(value, key) {
                    if (_.has(this, key)) {
                        this[key] = value;
                    } else {
                        Laces.Model.prototype.set.call(this, key, value);
                    }
                }, this);
            } else {
                Laces.Model.prototype.set.apply(this, arguments);
            }
        },

        subscribe: function() {

            Subscriber.prototype.subscribe.apply(this, arguments);
        },

        /**
         * The model's type.
         */
        type: "",

        /**
         * Converts the model to JSON representation for saving to the server.
         */
        toJSON: function() {

            var json = {};
            _.each(this.serializableProperties || this.keys(), function(key) {
                var value = this[key];
                if (key !== "id" && value !== undefined) {
                    json[key] = value;
                }
            }, this);
            if (!this.isNew()) {
                json.id = this.id;
            }
            return json;
        },

        /**
         * Unsets an attribute from the model.
         *
         * @param key Key of the attribute to set.
         */
        unset: function(key) {

            Laces.Model.prototype.remove.call(this, key);
        },

        /**
         * Returns the URL from which to fetch and to which to store the model.
         *
         * May also be a plain string instead of a method.
         */
        url: function() {

            return (this.plural || this.type) + "/" + (this.isNew() ? "" : this.id + "/");
        }
    });

    return Model;

});
