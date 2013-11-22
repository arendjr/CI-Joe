define("subscriber", ["lodash"], function(_) {

    "use strict";

    /**
     * Base for classes that want to subscribe to events from the notification bus or models.
     */
    function Subscriber(application) {

        /**
         * Reference to the application object.
         */
        this.application = application;

        /**
         * Map of notification channels the view is subscribed to.
         *
         * Note that channels are only registered here when they are subscribed to through the
         * view's subscribe() method.
         */
        this.subscribedChannels = {};

        /**
         * Map of model events the view is subscribed to.
         *
         * Note that events are only registered here when they are subscribed to through the
         * view's subscribe() method.
         */
        this.subscribedEvents = [];
    }

    _.extend(Subscriber.prototype, {

        /**
         * Destructor.
         */
        destruct: function() {

            var notificationBus = this.application.notificationBus;
            _.each(this.subscribedChannels, function(method, channel) {
                notificationBus.unsubscribe(channel, method, this);
            }, this);
            this.subscribedChannels = {};

            _.each(this.subscribedEvents, function(subscription) {
                subscription.model.unbind(subscription.event, subscription.listener);
            }, this);
            this.subscribedEvents = [];
        },

        /**
         * Subscribes to a notification channel or a model event for its entire lifetime. The object
         * will automatically unsubscribe itself from the channel/event when it's destructed.
         *
         * This method supports two distinct signatures. The first is first subscribing to a
         * notification channel:
         *
         * @param channel The channel to subscribe to.
         * @param method The listener method which will be invoked when a signal arrives on the
         *               notification channel. Should be a method of the subscriber.
         *
         * The second is for subscribing to a model event:
         *
         * @param model The model to subscribe to.
         * @param event The model's event to subscribe to.
         * @param method The listener method which will be invoked when a signal arrives on the
         *               notification channel. Should be a method of the subscriber.
         *
         * Note that this method only supports subscribing to each channel once.
         */
        subscribe: function(model, event, method) {

            var channel;
            if (!method) {
                channel = model;
                method = event;
            }

            if (channel) {
                if (_.has(this.subscribedChannels, channel)) {
                    console.log("Warning: Subscribing to already registered channel");
                }

                this.application.notificationBus.subscribe(channel, method, this);

                this.subscribedChannels[channel] = method;
            } else {
                if (typeof method === "string") {
                    method = this[method];
                }

                var listener = _.bind(method, this);

                model.on(event, listener);

                this.subscribedEvents.push({ model: model, event: event, listener: listener });
            }
        }

    });

    return Subscriber;

});
