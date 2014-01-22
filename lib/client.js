"use strict";


var _ = require("lodash");
var Errors = require("./errors");


/**
 * Client.
 *
 * Maintains the state of a single connected client.
 *
 * Inherits EventEmitter.
 */
function Client(config, options) {

    options = options || {};

    /**
     * Socket.io socket to communicate between master and client.
     *
     * Read-only property. Use assignSocket() to assign a socket to this client.
     */
    this.socket = null;
}

_.extend(Client.prototype, {

    /**
     * Assigns a socket to the client. Only a single socket can be assigned to a client.
     */
    assignSocket: function(socket) {

        if (this.socket) {
            throw Errors.serverError("Client already has a socket assigned");
        }

        this.socket = socket;
    },

    /**
     * Sends a notification signal to the client.
     */
    notify: function(channel, data) {

        this.socket.emit("server-push", _.extend({ channel: channel }, data));
    }

});


module.exports = Client;
