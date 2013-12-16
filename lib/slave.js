"use strict";


var _ = require("lodash");
var spawn = require("child_process").spawn;
var Errors = require("./errors");
var EventEmitter = require("events").EventEmitter;
var util = require("util");


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
     * Config object containing the slave's settings.
     */
    this.config = config;

    /**
     * Current connected state.
     *
     * Read-only property. Use connect() for starting a connection attempt, or disconnect() to
     * disconnect.
     */
    this.connectedState = "disconnected";

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
     *
     * Read-only property. Use setType() for setting.
     */
    this.type = config.type;
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

            socket.emit("slave", { name: self.name });

            self._setConnected("connected");
        });
        socket.on("error", function(exception) {
            console.log(exception);
            self._setConnected("disconnected");
            process.exit(2);
        });

        self.socket = socket;

        self._setConnected("connecting");
    },

    _disconnectFromMaster: function() {

        if (this.connectedState !== "disconnected") {
            if (this.socket) {
                this.socket.disconnect();
                this.socket = null;
            }

            this._setConnected("disconnect");

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

        if (this.connectedState !== connectedState) {
            this.connectedState = connectedState;

            this.emit("changed", "connectedState", connectedState);
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
            self._setConnected("disconnected");
            throw error;
        });
        child.on("exit", function(code, signal) {
            if (signal !== "SIGTERM") {
                console.log("Child died from unexpected signal: " + signal +
                            " (exit code: " + code + ")\n\n" +
                            "Output:\n" + slaveOutput);
            }

            self._setConnected("disconnected");
        });

        this.process = child;
        this._setConnected("connecting");
    },

    _startRemoteSlave: function() {

        console.log("STUB: Slave._startRemoteSlave()");
    }

});


module.exports = Slave;
