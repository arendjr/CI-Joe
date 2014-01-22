"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var Laces = require("laces.js");
var util = require("util");


/**
 * Base class for all models.
 */
function Model(config) {

    Laces.Model.call(this);

    /**
     * Config object containing the mission's settings.
     */
    this.config = config;

    /**
     * Model ID.
     *
     * Read-only property.
     */
    this.set("id", config.id);
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a model without ID");
    }

    this.initialize.apply(this, arguments);
}

/**
 * Creates a subclass from the Model class.
 */
Model.extend = function(object) {

    var child = function() {
        Model.apply(this, arguments);
    };
    util.inherits(child, Model);
    child.uniqueId = function(models) { return Model.uniqueId(object.type, models); };
    _.extend(child.prototype, object);
    return child;
};

/**
 * Generates a unique model ID.
 *
 * @param prefix Prefix to use before the ID.
 * @param models Array of models among which the ID should be unique.
 */
Model.uniqueId = function(prefix, models) {

    var index = 0, id = prefix + index;
    while (_.any(models, { id: id })) {
        id = prefix + (++index);
    }
    return id;
};

util.inherits(Model, Laces.Model);

_.extend(Model.prototype, {

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
    set: function(key, value) {

        if (typeof key === "object") {
            _.each(key, function(value, key) {
                if (_.has(this, key)) {
                    this[key] = value;
                } else {
                    Laces.Model.prototype.set.call(this, key, value);
                }
            }, this);
        } else {
            this.config[key] = value;

            Laces.Model.prototype.set.apply(this, arguments);
        }
    },

    /**
     * Generates a JSON representation of the model for serialization.
     */
    toJSON: function() {

        return _.clone(this.config);
    }
});


module.exports = Model;
