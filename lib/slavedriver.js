"use strict";


var _ = require("lodash");
var Slave = require("./slave");


/**
 * Slave Driver.
 *
 * Keeps track of running slaves, and fires up slaves if necessary.
 */
function SlaveDriver(config) {

    /**
     * Config object.
     */
    this.config = config;

    /**
     * Array with all the slave instances.
     */
    this.slaves = [];

    this._init();
}

_.extend(SlaveDriver.prototype, {

    /**
     * Destructor. Disconnects all slaves.
     */
    destruct: function() {

        _.each(this.slaves, function(slave) {
            slave.disconnect();
        });
    },

    _init: function() {

        this.slaves = _.map(this.config.slaves, function(config) {
            return new Slave(config, { isMaster: true, masterConfig: this.config.master });
        }, this);
    }

});


module.exports = SlaveDriver;
