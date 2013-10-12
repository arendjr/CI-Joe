define("extend", ["lodash"], function(_) {

    /**
     * Extend method copied from Backbone.js 1.1.0
     *
     * (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
     * (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Backbone may be freely distributed under the MIT license.
     * For all details and documentation:
     * http://backbonejs.org
     */
    function extend(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    }

    return extend;

});
