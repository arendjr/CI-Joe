"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


/**
 * Base class for all models.
 */
function Model(config) {

    EventEmitter.call(this);

    /**
     * Config object containing the mission's settings.
     */
    this.config = config;

    /**
     * Model ID.
     *
     * Read-only property.
     */
    this.id = config.id;
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

util.inherits(Model, EventEmitter);

_.extend(Model.prototype, {

    /**
     * Sets one or more properties to a new value.
     *
     * @param propertyName Name of the property to set. May also be an object containing key-value
     *                     pairs, in which case set() is called for every pair.
     * @param value New value of the property. Only set if propertyName is not an object.
     */
    set: function(propertyName, value) {

        if (typeof propertyName === "object") {
            _.each(propertyName, function(value, name) {
                this.set(name, value);
            }, this);
        } else {
            if (_.has(this, propertyName)) {
                if (this[propertyName] !== value) {
                    var setter = "set" + propertyName.slice(0, 1).toUpperCase() +
                                         propertyName.slice(1);
                    if (_.isFunction(this[setter])) {
                        this[setter].call(this, value);
                    } else {
                        this[propertyName] = value;
                        this.config.set(propertyName, value);

                        this.emit("change", propertyName, value);
                    }
                }
            } else {
                throw Errors.serverError("Unknown property: " + propertyName);
            }
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
