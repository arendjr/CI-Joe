define("notificationbus", ["lodash", "setzerotimeout"], function(_, setZeroTimeout) {

    "use strict";

    /**
     * Notification Bus.
     *
     * Used for routing signals throughout the client itself as well as from the server to the
     * client.
     *
     * Maintains a single connection to the server in order to subscribe to change notifications.
     * Interested parties should subscribe to channels for change notifications through this class.
     *
     * This class may emit the following notification signals:
     * - connection:established
     * - connection:lost
     */
    function NotificationBus(application) {

        this.application = application;

        this.nodeBaseUrl = "/";

        this._socket = null;

        this._subscriptions = {};

        require.config({
            paths: { socketio: this.nodeBaseUrl + "socket.io/socket.io" },
            shim: { socketio: { exports: "io" } }
        });
    }

    _.extend(NotificationBus.prototype, {

        /**
         * Connects to the change notification server.
         */
        connect: function() {

            var self = this;
            require(["socketio"], function(io) {
                self._openSocket(io);
            });
        },

        /**
         * Subscribes a listener to a channel.
         *
         * @param channel String identifier of the channel, eg. "network_timeline:0123456789abcdef".
         *                Multiple channels may be specified by passing in a space-separated list of
         *                identifiers.
         * @param listener Model which should listen to updates being propagated over the channel.
         *                 Any valid listener should have a method with this signature:
         *                   onNotification(channel: String, data: Object)
         * @param context Optional context object to which the listener will be applied when called.
         */
        subscribe: function(channel, listener, context) {

            if (channel.indexOf(" ") > -1) {
                _.each(channel.split(" "), function(channel) {
                    this._subscribeOne(channel, listener, context);
                }, this);
            } else {
                this._subscribeOne(channel, listener, context);
            }
        },

        _subscribeOne: function(channel, listener, context) {

            if (!_.has(this._subscriptions, channel)) {
                this._subscriptions[channel] = [];
            }

            var hasSubscription = _.find(this._subscriptions[channel], function(subscription) {
                return subscription.listener === listener && subscription.context === context;
            });

            if (!hasSubscription) {
                this._subscriptions[channel].push({ listener: listener, context: context });
            }
        },

        /**
         * Unsubscribes a listener.
         *
         * @param channel String identifier of the channel, or "*" to unsubscribe from all channels.
         *                Multiple channels may be specified by passing in a space-separated list of
         *                identifiers.
         * @param listener Model listening to updates over the channel. Use null to unsubscribe all
         *                 listeners belonging to the given context.
         * @param context Optional context object to which the listener will be applied when called.
         */
        unsubscribe: function(channel, listener, context) {

            if (channel === "*") {
                if (listener === null) {
                    _.each(this._subscriptions, function(subscriptions, key) {
                        this._subscriptions[key] = _.reject(subscriptions, { context: context });

                        this._cleanupChannel(key);
                    }, this);
                } else {
                    _.each(this._subscriptions, function(subscriptions, key) {
                        this._subscriptions[key] = _.reject(subscriptions, function(subscription) {
                            return subscription.listener === listener &&
                                   (!context || subscription.context === context);
                        });

                        this._cleanupChannel(key);
                    }, this);
                }
            } else if (channel.indexOf(" ") > -1) {
                _.each(channel.split(" "), function(channel) {
                    this.unsubscribe(channel, listener);
                }, this);
            } else {
                var subscriptions = this._subscriptions[channel];
                if (listener === null) {
                    this._subscriptions[channel] = _.filter(subscriptions, function(subscription) {
                        return subscription.context !== context;
                    });
                } else {
                    this._subscriptions[channel] = _.filter(subscriptions, function(subscription) {
                        return subscription.listener !== listener ||
                               (context && subscription.context !== context);
                    });
                }

                this._cleanupChannel(channel);
            }
        },

        _cleanupChannel: function(channel) {

            if (this._subscriptions[channel].length === 0) {
                delete this._subscriptions[channel];
            }
        },

        /**
         * Sends a signal to all listeners of a channel.
         *
         * @param channel String identifier of the channel.
         * @param data Data object passed to listeners to the channel.
         */
        signal: function(channel, data) {

            var self = this;
            setZeroTimeout(function() {
                if (_.has(self._subscriptions, channel)) {
                    _.each(self._subscriptions[channel], function(subscription) {
                        subscription.listener.call(subscription.context, data, channel);
                    });
                }
            }, 0);
        },

        _openSocket: function(io) {

            var host = this.nodeBaseUrl;
            if (host.slice(-1) === "/") {
                host = host.substr(0, host.length - 1);
            }

            var socket = io.connect(host, {
                "reconnection limit": 60 * 1000,
                "max reconnection attempts": Infinity
            });
            if (!socket) {
                console.log("Failed to connect to notification host " + host);
                return;
            }

            this._socket = socket;

            this._subscribeRemote();
        },

        _subscribeRemote: function() {

            var socket = this._socket;
            socket.emit("client", {
                // TODO: sessionToken: ...
            });

            var self = this;
            socket.on("server-push", function(data) {
                var channel = data.channel;
                delete data.channel;
                self.signal("server-push:" + channel, data);
            });
        }

    });

    return NotificationBus;

});
