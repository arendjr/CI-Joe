"use strict";


var _ = require("lodash");
var Slave = require("./slave");


/**
 * Slave Driver.
 *
 * Keeps track of running slaves, and fires up slaves if necessary.
 */
function SlaveDriver(config, clientPool) {

    /**
     * Client Pool instance.
     */
    this.clients = clientPool;

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

        var self = this;
        this.slaves = _.map(this.config.slaves, function(config) {
            var slave = new Slave(config, { isMaster: true, masterConfig: self.config.master });
            slave.on("changed", function() {
                self.clients.notifyAll("slaves:update", { slave: slave.toJSON() });
            });
            return slave;
        });
    }

});


module.exports = SlaveDriver;
