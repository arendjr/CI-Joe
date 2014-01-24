"use strict";


var _ = require("lodash");
var spawn = require("child_process").spawn;
var Errors = require("./errors");
var Model = require("./model");


/**
 * Slave.
 *
 * Maintains a single slave and its connection to the master or slave process.
 *
 * Inherits EventEmitter.
 */
module.exports = Model.extend({

    initialize: function(config, options) {

        options = options || {};

        /**
         * Applicability of the slave, either "general" or "assignment".
         *
         * "general" means the slave is a generic slave which can be used
         * for executing any type of mission, "assignment" means the slave can only be used for missions
         * which have been explicitly assigned to it.
         */
        this.set("applicability", config.applicability || "general", {
            setFilter: function(applicability) {
                if (applicability === "general" || applicability === "assignment") {
                    return applicability;
                } else {
                    throw Errors.serverError("Invalid slave applicability: " + applicability);
                }
            }
        });

        /**
         * Current connected state.
         *
         * Read-only property. Use connect() for starting a connection attempt, or disconnect() to
         * disconnect.
         */
        this.connectedState = "disconnected";

        /**
         * Name of the slave.
         */
        this.set("name", config.name || "");

        /**
         * Options for managing the slave. May contain the following properties:
         * isMaster - Boolean indicating whether the running process belongs to the master.
         * masterConfig - Configuration object containing the hostname and port of the server.
         */
        this.options = options;

        /**
         * Child process of the slave. Only applicable if this is the master process, for local slaves.
         */
        this.process = null;

        /**
         * Socket.io socket to communicate between master and slave.
         *
         * Read-only property. Use assignSocket() to assign a socket to this slave.
         */
        this.socket = null;

        /**
         * Type of the slave, either "local" or "remote".
         */
        this.set("type", config.type || "local", {
            setFilter: function(type) {
                if (type === "local" || type === "remote") {
                    return type;
                } else {
                    throw Errors.serverError("Invalid slave type: " + type);
                }
            }
        });
    },

    /**
     * Assigns a socket to this slave. Only a single socket can be assigned to a slave.
     */
    assignSocket: function(socket) {

        if (this.socket) {
            throw Errors.serverError("Slave already has a socket assigned");
        }

        this.socket = socket;

        this._setConnected("connected");

        socket.on("disconnect", _.bind(this._onDisconnect, this));
    },

    /**
     * Attempts to connect the slave to the master.
     *
     * If the current process belongs to the master, it will attempt to fire up the slave.
     * Otherwise, it will attempt to register itself with the master.
     */
    connect: function() {

        if (this.connectedState === "disconnected") {
            if (this.options.isMaster) {
                if (this.type === "local") {
                    this._startLocalSlave();
                } else {
                    this._startRemoteSlave();
                }
            } else {
                this._connectToMaster();
            }
        }
    },

    /**
     * Disconnects the slave from the master.
     *
     * This will disconnect the Socket.io connection between master and slave and, if the current
     * process belongs to the master and the slave was started locally, will kill the slave process.
     */
    disconnect: function() {

        if (this.connectedState === "connected") {
            if (this.options.isMaster) {
                if (this.type === "local") {
                    this._killLocalSlave();
                } else {
                    this._disconnectRemoteSlave();
                }
            } else {
                this._disconnectFromMaster();
            }
        }
    },

    /**
     * Sends a notification signal to the slave.
     */
    notify: function(channel, data) {

        this.socket.emit(channel, data);
    },

    /**
     * Generates a JSON representation of the slave to send through the REST API.
     */
    toJSON: function() {

        return _.extend({
            connectedState: this.connectedState
        }, this.config);
    },

    _connectToMaster: function() {

        var io = require("socket.io-client");
        var masterConfig = this.options.masterConfig;
        var socket = io.connect("http://" + masterConfig.hostname + ":" + masterConfig.port);

        var self = this;
        socket.on("connect", function() {
            console.log("Connected.");

            socket.emit("slave", { id: self.id });

            self.set("connectedState", "connected");
        });
        socket.on("error", function(exception) {
            console.log(exception);
            self.set("connectedState", "disconnected");
            process.exit(2);
        });

        self.socket = socket;

        self.set("connectedState", "connecting");
    },

    _disconnectFromMaster: function() {

        if (this.connectedState !== "disconnected") {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            this._setConnected("disconnected");

            process.exit();
        }
    },

    _disconnectRemoteSlave: function() {

        console.log("STUB: Slave._disconnectRemoteSlave()");
    },

    _killLocalSlave: function() {

        if (!this.process) {
            throw Errors.serverError("No process to kill");
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.process.kill();
    },

    _onDisconnect: function() {

        this.socket = null;

        this._setConnected("disconnected");
    },

    _setConnected: function(connectedState) {

        if (_.contains(["connected", "connecting", "disconnected"], connectedState)) {
            this.connectedState = connectedState;
        } else {
            throw Errors.serverError("Invalid connected state: " + connectedState);
        }
    },

    _startLocalSlave: function() {

        var slaveOutput = "";

        var self = this;
        var child = spawn("node", ["app/slave.js", "--name=" + this.name], {
            cwd: process.cwd()
        });
        child.stdout.on("data", function(data) {
            slaveOutput += data;
        });
        child.stderr.on("data", function(data) {
            slaveOutput += data;
        });
        child.on("error", function(error) {
            self.set("connectedState", "disconnected");
            throw error;
        });
        child.on("exit", function(code, signal) {
            if (signal === null) {
                console.log("Child died unexpectedly (exit code: " + code + ")\n\n" +
                            "Output:\n" + slaveOutput);
            }

            self.set("connectedState", "disconnected");
        });

        this.process = child;
        this._setConnected("connecting");
    },

    _startRemoteSlave: function() {

        console.log("STUB: Slave._startRemoteSlave()");
    }

});
