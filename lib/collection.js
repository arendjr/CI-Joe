"use strict";


var _ = require("lodash");
var Errors = require("./errors");
var Laces = require("laces.js");
var util = require("util");


/**
 * Collection.
 *
 * Manages a collection of models.
 */
function Collection(config) {

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Key of the models in the config object.
     *
     * Must be set by the subclass' initialize() method.
     */
    this.key = "";

    /**
     * Amount of models.
     */
    this.length = 0;

    /**
     * Array of models.
     */
    this.models = new Laces.Array();

    /**
     * The model class to wrap models in.
     *
     * Must be set by the subclass' initialize() method.
     */
    this.Model = null;

    this.initialize();

    this._init();
}

/**
 * Creates a subclass from the Collection class.
 */
Collection.extend = function(object) {

    var child = function() {
        Collection.apply(this, arguments);
    };
    util.inherits(child, Collection);
    _.extend(child.prototype, object);
    return child;
};

_.extend(Collection.prototype, {

    /**
     * Adds a model.
     *
     * @param data Data object containing all the model's properties.
     */
    add: function(data) {

        var config = new Laces.Map({
            id: this.Model.uniqueId(this.models)
        });
        _.each(data, function(value, propertyName) {
            config.set(propertyName, value);
        });

        var model = new this.Model(config);
        this.models.push(model);

        if (!this.config[this.key]) {
            this.config.set(this.key, []);
        }
        this.config[this.key].push(config);

        return model;
    },

    /**
     * Returns a model by ID.
     */
    get: function(id) {

        return _.find(this.models, { id: id });
    },

    /**
     * Removes a model.
     */
    remove: function(id) {

        var index = _.findIndex(this.config[this.key], { id: id });
        if (index > -1) {
            this.config[this.key].remove(index);

            this.models.splice(_.findIndex(this.models, { id: id }), 1);

            return true;
        } else {
            return false;
        }
    },

    /**
     * Converts an array with all models converted to their JSON representation.
     */
    toJSON: function() {

        return _.map(this.models, function(model) {
            return model.toJSON();
        });
    },

    /**
     * Updates a model.
     *
     * @param data Data object containing all the model's properties.
     */
    update: function(data) {

        var model = this.get(data.id);
        if (model) {
            _.each(data, function(value, propertyName) {
                if (propertyName !== "id") {
                    model.set(propertyName, value);
                }
            });
            return model;
        } else {
            throw Errors.notFound();
        }
    },

    _init: function() {

        _.each(this.config[this.key], function(config) {
            this.models.push(new this.Model(config));
        }, this);

        this.models.on("add remove", _.bind(this._updateLength, this), { initialFire: true });
    },

    _updateLength: function() {

        this.length = this.models.length;
    }

});

// mixin useful LoDash methods
_.each(["any", "each", "filter", "find", "findIndex", "map", "reject", "without"], function(func) {
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


module.exports = Collection;
