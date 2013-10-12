define("view", ["extend", "jquery", "lodash"], function(extend, $, _) {

    "use strict";

    /**
     * Base class for all views.
     *
     * @param context Application or View instance that serves as a context for this view. If a
     *                View instance is given, it is assumed to be the parent view.
     * @param options Optional options object. May contain the following properties:
     *                $el - jQuery container containing the top-level element to be used by this
     *                      view. If none is given, a new element is created for the view.
     */
    function View(context, options) {

        options = options || {};

        // context may be an Application or View object.
        var application = null, parent = null;
        if (context instanceof View) {
            application = context.application;
            parent = context;
        } else {
            application = context;
        }

        /**
         * Reference to the application object.
         */
        this.application = application;
        if (!this.application) {
            console.log("View instantiated without Application reference");
        }

        /**
         * Reference to the parent view.
         */
        this.parent = parent;

        /**
         * References to all the children of the view.
         */
        this.children = [];

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

        /**
         * jQuery container containing the top-level element used by the view.
         */
        this.$el = options.$el || $("<" + this.tagName + ">");

        if (parent) {
            this.reparent(parent);
        }

        if (this.initialize) {
            this.initialize(options);
        }
    }

    View.extend = extend;

    _.extend(View.prototype, {

        /**
         * Registers another view as a child of this view.
         *
         * @param child Another view.
         *
         * Child views automatically register themselves with their parent when the parent is passed
         * as context to the View constructor of the child.
         */
        addChild: function(child) {

            this.children.push(child);
        },

        /**
         * Convenience shortcut for showing an error through the feedback ticker.
         */
        showError: function(message, error) {

            this.application.feedbackTicker.showError(message, error);
        },

        /**
         * Convenience shortcut for showing a notice through the feedback ticker.
         */
        showNotice: function(notice) {

            this.application.feedbackTicker.showNotice(notice);
        },

        remove: function() {

            var notificationBus = this.application.notificationBus;
            _.each(this.subscribedChannels, function(method, channel) {
                notificationBus.unsubscribe(channel, method, this);
            }, this);
            this.subscribedChannels = {};

            _.each(this.subscribedEvents, function(subscription) {
                subscription.model.unbind(subscription.event, subscription.listener);
            }, this);
            this.subscribedEvents = [];

            this.removeChildren();

            this.$el.remove();
        },

        /**
         * Removes a registered child from the list of children.
         *
         * @param child The child view.
         */
        removeChild: function(child) {

            child.remove();
            this.children = _.without(this.children, child);
        },

        /**
         * Removes all registered child views of this view.
         *
         * This method is called automatically when the view itself is removed.
         */
        removeChildren: function() {

            _.each(this.children, function(child) {
                child.remove();
            });
            this.children = [];
        },

        /**
         * Renders the view.
         *
         * Should return the view's $el property.
         */
        render: function() {

            return this.$el;
        },

        /**
         * Registers the view with its parent.
         *
         * This is called automatically by the constructor and should normally not need to be called
         * manually.
         */
        reparent: function(parent) {

            parent.addChild(this);
        },

        /**
         * Subscribes the view to a notification channel or a model event for its entire lifetime.
         * The view will automatically unsubscribe itself from the channel/event when it's removed.
         *
         * This method supports two distinct signatures. The first is first subscribing to a
         * notification channel:
         *
         * @param channel The channel to subscribe to.
         * @param method The listener method which will be invoked when a signal arrives on the
         *               notification channel. Should be a method of the view.
         *
         * The second is for subscribing to a model event:
         *
         * @param model The model to subscribe to.
         * @param event The model's event to subscribe to.
         * @param method The listener method which will be invoked when a signal arrives on the
         *               notification channel. Should be a method of the view.
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
                    console.log("Warning: Subscribing view to channel it is already registered to");
                }

                this.application.notificationBus.subscribe(channel, method, this);

                this.subscribedChannels[channel] = method;
            } else {
                var listener = _.bind(method, this);

                model.bind(event, listener);

                this.subscribedEvents.push({ model: model, event: event, listener: listener });
            }
        },

        /**
         * Tag name of the top-level element that's created when the view is instantiated.
         */
        tagName: "div",

        /**
         * Runs CSS queries against the DOM scoped within this view.
         */
        $: function(selector) {

            return this.$el.find(selector);
        }

    });

    return View;

});
