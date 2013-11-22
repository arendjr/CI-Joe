define("view", ["extend", "jquery", "lodash", "subscriber"], function(extend, $, _, Subscriber) {

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

        if (!application) {
            console.log("View instantiated without Application reference");
        }

        Subscriber.call(this, application);

        /**
         * Reference to the parent view.
         */
        this.parent = parent;

        /**
         * References to all the children of the view.
         */
        this.children = [];

        /**
         * The options passed to the constructor (or an empty object if none were passed).
         */
        this.options = options;

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

        this._events = [];

        this.delegateEvents();

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
         * Creates a new model.
         *
         * this method is a convenience shortcut for ModelFactory.create().
         */
        createModel: function(modelType, modelId) {

            return this.application.modelFactory.create(modelType, modelId);
        },

        /**
         * Attaches all listeners from the events map to the view's top-level element.
         *
         * All of the listeners specified by superclasses are automatically inherited by subclasses
         * unless explicitly overwritten.
         */
        delegateEvents: function() {

            this.undelegateEvents();

            var events = {};
            var object = this;
            while (object.constructor !== View) {
                if (_.has(object.constructor.prototype, "events")) {
                    events = _.extend(_.clone(object.events), events);
                }
                object = object.constructor.__super__;
            }

            _.each(events, function(listener, event) {
                if (typeof listener === "string") {
                    listener = _.bind(this[listener], this);
                } else if (typeof listener === "function") {
                    listener = _.bind(listener, this);
                }

                var selector = "";
                if (event.indexOf(" ") > 0) {
                    selector = event.split(" ").slice(1).join(" ");
                    event = event.split(" ", 1)[0];
                }

                if (selector) {
                    this.$el.on(event, selector, listener);
                } else {
                    this.$el.on(event, listener);
                }

                this._events.push({ event: event, selector: selector, listener: listener });
            }, this);
        },

        /**
         * Map of DOM events to which the view listens.
         *
         * The keys of the map specify the events, with an optional space-separated selector. The
         * values are the listeners, which may be specified as either a function object or the
         * string name of a view method. Examples:
         *
         * "click": function(event) { console.log("clicked"); }
         * "click button": "onButtonClicked"
         */
        events: {},

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

        /**
         * Removes the view from the DOM.
         *
         * Also acts as a destructor by terminating all the view's subscriptions and removing the
         * view's children.
         */
        remove: function() {

            Subscriber.prototype.destruct.call(this);

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
         * Sets a new element to use for the view.
         *
         * Automatically re-attaches all listeners from the events map to the new element.
         *
         * @param el The new element. May be either a DOM element or a jQuery container.
         */
        setElement: function(el) {

            this.undelegateEvents();

            this.$el = (el.jquery ? el : $(el));

            this.delegateEvents();
        },

        subscribe: function() {

            Subscriber.prototype.subscribe.apply(this, arguments);
        },

        /**
         * Tag name of the top-level element that's created when the view is instantiated.
         */
        tagName: "div",

        /**
         * Detaches all listeners from the events map from the view's top-level element.
         */
        undelegateEvents: function() {

            _.each(this._events, function(event) {
                if (event.selector) {
                    this.$el.off(event.event, event.selector, event.listener);
                } else {
                    this.$el.off(event.event, event.listener);
                }
            }, this);

            this._events = [];
        },

        /**
         * Runs CSS queries against the DOM scoped within this view.
         */
        $: function(selector) {

            return this.$el.find(selector);
        }

    });

    return View;

});
