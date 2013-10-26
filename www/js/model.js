define("model", ["extend", "laces", "lodash"], function(extend, Laces, _) {

    "use strict";

    /**
     * Base class for all models.
     *
     * @param application Application instance.
     */
    function Model(application, attributes) {

        /**
         * Reference to the application object.
         */
        this.application = application;
        if (!this.application) {
            console.log("Model instantiated without Application reference");
        }

        /**
         * The model's ID.
         */
        this.set("id", null);

        if (attributes) {
            this.set(attributes);
        }

        if (this.initialize) {
            this.initialize();
        }
    }

    Model.extend = extend;

    Model.prototype = new Laces.Model();

    _.extend(Model.prototype, {

        /**
         * Fetches all the model's attributes from the server.
         *
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the promise callbacks.
         */
        fetch: function(options) {

            options = options || {};

            var url = _.result(this, "url");

            var self = this;
            var promise = this.application.api.ajax(url, { context: options.context });
            promise.then(function(data) {
                self.set(data);
            });
            return promise;
        },

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
                dataType: "json",
                type: (this.id ? "PUT" : "POST")
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
                    Laces.Model.prototype.set.call(this, key, value);
                }, this);
            } else {
                Laces.Model.prototype.set.apply(this, arguments);
            }
        },

        /**
         * The model's type.
         */
        type: "",

        url: function() {

            return this.type + "/" + (this.id ? this.id + "/" : "");
        }
    });

    return Model;

});
