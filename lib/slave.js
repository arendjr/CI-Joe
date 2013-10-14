"use strict";


var _ = require("lodash");
var childProcess = require("child_process");
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


var ConnectedState = {
    Disconnected: 0,
    Connecting: 1,
    Connected: 2
};


/**
 * Slave.
 *
 * Maintains a single slave and its connection to the master or slave process.
 *
 * Inherits EventEmitter.
 */
function Slave(config, options) {

    options = options || {};

    EventEmitter.call(this);

    /**
     * Config object containing the slave's settings.
     */
    this.config = config;

    /**
     * Options for managing the slave. May contain the following properties:
     * isMaster - Boolean indicating whether the running process belongs to the master.
     * masterConfig - Configuration object containing the hostname and port of the server.
     */
    this.options = options;

    /**
     * Slave ID.
     *
     * Read-only property.
     */
    this.id = config.id;
    if (!this.id) {
        throw Errors.serverError("Cannot instantiate a slave without ID");
    }

    /**
     * Name of the slave.
     *
     * Read-only property. Use setName() for setting.
     */
    this.name = config.name;

    /**
     * Type of the slave, either "local" or "remote".
     *
     * Read-only property. Use setType() for setting.
     */
    this.type = config.type;

    /**
     * Applicability of the slave, either "general" or "assignment".
     *
     * "general" means the slave is a generic slave which can be used
     * for executing any type of mission, "assignment" means the slave can only be used for missions
     * which have been explicitly assigned to it.
     *
     * Read-only property. Use setApplicability() for setting.
     */
    this.applicability = config.applicability || "general";

    /**
     * Current connected state.
     *
     * Read-only property. Use connect() for starting a connection attempt, or disconnect() to
     * disconnect.
     */
    this.connectedState = ConnectedState.Disconnected;

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
}

util.inherits(Slave, EventEmitter);

_.extend(Slave.prototype, {

    /**
     * Assigns a socket to this slave. Only a single socket can be assigned to a slave.
     */
    assignSocket: function(socket) {

        if (this.socket) {
            throw Errors.serverError("Slave already has a socket assigned");
        }

        this.socket = socket;

        this._setConnected(ConnectedState.Connected);
    },

    /**
     * Attempts to connect the slave to the master.
     *
     * If the current process belongs to the master, it will attempt to fire up the slave.
     * Otherwise, it will attempt to register itself with the master.
     */
    connect: function() {

        if (!this.connected) {
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

        if (this.connected) {
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
     * Sets the name of the slave.
     */
    setName: function(name) {

        if (this.name !== name) {
            this.name = name;
            this.config.name = name;

            this.emit("changed", "name", name);
        }
    },

    /**
     * Sets the type of the slave. Should be either "local" or "remote".
     */
    setType: function(type) {

        if (this.type !== type) {
            if (type === "local" || type === "remote") {
                this.type = type;
                this.config.type = type;

                this.emit("changed", "type", type);
            } else {
                throw Errors.serverError("Invalid slave type: " + type);
            }
        }
    },

    /**
     * Sets the applicability of the slave. Should be either "general" or "assignment".
     */
    setApplicability: function(applicability) {

        if (this.applicability !== applicability) {
            if (applicability === "general" || applicability === "assignment") {
                this.applicability = applicability;
                this.config.applicability = applicability;

                this.emit("changed", "applicability", applicability);
            } else {
                throw Errors.serverError("Invalid slave applicability: " + applicability);
            }
        }
    },

    _connectToMaster: function() {

        var io = require("socket.io-client");
        var masterConfig = this.options.masterConfig;
        var socket = io.connect("http://" + masterConfig.hostname + ":" + masterConfig.port);

        var self = this;
        socket.on("connect", function() {
            console.log("Connected.");

            socket.emit("slave", { name: self.name });

            self._setConnected(ConnectedState.Connected);
        });
        socket.on("error", function(exception) {
            console.log(exception);
            self._setConnected(ConnectedState.Disconnected);
            process.exit(2);
        });

        self.socket = socket;

        self._setConnected(ConnectedState.Connecting);
    },

    _disconnectFromMaster: function() {

        if (this.connectedState !== ConnectedState.Disconnected) {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            this._setConnected(ConnectedState.Disconnect);

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

    _setConnected: function(connected) {

        if (this.connected !== connected) {
            this.connected = connected;

            this.emit("changed", "connected", connected);
        }
    },

    _startLocalSlave: function() {

        var self = this;
        var child = childProcess.spawn(
            "node",
            ["app/slave.js", "--name=" + this.name],
            { cwd: process.cwd() }
        );
        child.on("error", function(error) {
            self._setConnected(ConnectedState.Disconnected);
            throw error;
        });
        child.on("exit", function(code, signal) {
            if (signal !== "SIGTERM") {
                console.log("Child died from unexpected signal: " + signal +
                            " (exit code: " + code + ")");
            }

            self._setConnected(ConnectedState.Disconnected);
        });

        this.process = child;
        this._setConnected(ConnectedState.Connecting);
    },

    _startRemoteSlave: function() {

        console.log("STUB: Slave._startRemoteSlave()");
    }

});


module.exports = Slave;
