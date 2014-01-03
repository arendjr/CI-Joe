"use strict";


var _ = require("lodash");
var EventEmitter = require("events").EventEmitter;
var Slave = require("./slave");
var util = require("util");


/**
 * Slave Driver.
 *
 * Keeps track of running slaves, and fires up slaves if necessary.
 */
function SlaveDriver(config, clientPool) {

    EventEmitter.call(this);

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

util.inherits(SlaveDriver, EventEmitter);

_.extend(SlaveDriver.prototype, {

    /**
     * Destructor. Disconnects all slaves.
     */
    destruct: function() {

        _.each(this.slaves, function(slave) {
            slave.disconnect();
        });
    },

    /**
     * Returns a slave by ID.
     */
    getSlave: function(id) {

        return _.find(this.slaves, { id: id });
    },

    /**
     * Returns the slave that has the given socket assigned.
     */
    getSlaveBySocket: function(socket) {

        return _.find(this.slaves, { socket: socket });
    },

    /**
     * Sends a notification signal to all connected slaves.
     */
    notifyAll: function(channel, data) {

        _.each(this.slaves, function(slave) {
            if (slave.connectedState === "connected") {
                slave.notify(channel, data);
            }
        });
    },

    _init: function() {

        var self = this;
        this.slaves = _.map(this.config.slaves, function(config) {
            var slave = new Slave(config, { isMaster: true, masterConfig: self.config.master });
            slave.on("change", function() {
                self.clients.notifyAll("slaves:update", { slave: slave.toJSON() });
            });
            slave.on("disconnected", function() {
                self.emit("slave-disconnected", { slave: slave });
            });
            return slave;
        });
    }

});


module.exports = SlaveDriver;
