"use strict";


var _ = require("lodash");
var Client = require("./client");
var Errors = require("./errors");


/**
 * Client Pool.
 *
 * Maintains all connected clients.
 */
function ClientPool() {

    /**
     * Array with all the client instances.
     */
    this.clients = [];
}

_.extend(ClientPool.prototype, {

    /**
     * Adds a new client by its socket.
     */
    addClientBySocket: function(socket) {

        if (_.any(this.clients, { socket: socket })) {
            throw Errors.serverError("Socket is already used with another client");
        }

        var client = new Client();
        client.assignSocket(socket);
        this.clients.push(client);
    }

});


module.exports = ClientPool;
