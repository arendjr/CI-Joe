"use strict";


var _ = require("lodash");
var Slave = require("../lib/slave");


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

    _init: function() {

        _.each(this.config.slaves, function(slaveConfig) {
            this.slaves.push(new Slave(slaveConfig, {
                isMaster: true,
                masterConfig: this.config.master
            }));
        }, this);
    }

});


module.exports = SlaveDriver;
