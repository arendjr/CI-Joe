define("api", ["jquery", "jquery.storage", "lodash", "status"], function($, $storage, _, Status) {

    "use strict";

    var BASE_URL = "/api/";

    /**
     * API
     *
     * This is the main access point for communicating with the API.
     *
     * @param application Reference to the application object.
     */
    function API(application) {

        /**
         * Reference to the application object.
         */
        this.application = application;

        /**
         * API session token.
         */
        this.sessionToken = "";
    }

    _.extend(API.prototype, {

        /**
         * Sends a remote request to the API.
         *
         * This method can be used as a drop-in replacement for $.ajax(), but provides a few extra
         * benefits:
         * - If we have a valid session token, the request will be signed with it.
         * - Error handlers will receive an error object (with code and message properties) as their
         *   first argument, instead of a jqXHR object.
         */
        ajax: function(url, settings) {

            if (settings) {
                settings.url = url;
            } else if (typeof url === "string") {
                settings = { url: url };
            } else {
                settings = url;
            }

            settings.type = settings.type || "GET";
            settings.url = BASE_URL + settings.url;

            var context = settings.context;
            settings.context = this;

            var successCallback = settings.success;
            delete settings.success;

            var errorCallback = settings.error;
            delete settings.error;

            var deferred = new $.Deferred();
            deferred.then(function() {
                if (successCallback) {
                    successCallback.apply(context, arguments);
                }
            }, function() {
                if (errorCallback) {
                    errorCallback.apply(context, arguments);
                }
            });

            this.signParams(settings);
            $.ajax(settings).then(function(data, textStatus, xhr) {
                deferred.resolveWith(context, [data, textStatus, xhr]);
            }, function(xhr, textStatus, errorThrown) {
                var error = this._errorFromXhr(xhr, settings.url);
                if (error.code === Status.INVALID_TOKEN) {
                    this.sessionToken = "";
                }
                deferred.rejectWith(context, [error, textStatus, errorThrown]);
            });

            return deferred.promise();
        },

        /**
         * Restores the previous session.
         */
        restoreSession: function() {

            this.sessionToken = $.localStorage("session_token") || "";

            if (this.sessionToken) {
                this.application.notificationBus.signal("api:tokenAcquired");
            } else {
                this.application.notificationBus.signal("api:noToken");
            }
        },

        /**
         * Sets a new session token.
         *
         * @param token The session token.
         */
        setSessionToken: function(token) {

            var hadToken = !!this.sessionToken;

            this.sessionToken = token;

            $.localStorage("session_token", token);

            if (token && !hadToken) {
                this.application.notificationBus.signal("api:tokenAcquired");
            }
        },

        /**
         * Performs a sign-in attempt.
         *
         * @param username Username of the user to sign in.
         * @param password Password of the user to sign in.
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the
         *
         * @return jQuery Deferred promise. When the promise is resolved, the access and refresh
         *         tokens will be set already. If the promise is rejected, the fail handler will
         *         receive the error code and message arguments.
         */
        signIn: function(username, password, options) {

            options = options || {};
            var context = options.context;

            var deferred = new $.Deferred();

            $.ajax(BASE_URL + "auth/authenticate", {
                type: "POST",
                context: this,
                data: {
                    username: username,
                    password: password
                },
                dataType: "json",
                success: function(data) {
                    if (data.sessionToken) {
                        this.setSessionToken(data.sessionToken);
                        deferred.resolveWith(context, []);
                    } else {
                        deferred.rejectWith(context, [Status.Replies.UNEXPECTED_REPLY]);
                    }
                },
                error: function(request, textStatus) {
                    if (textStatus === "timeout") {
                        deferred.rejectWith(context, [Status.Replies.NO_CONNECTION]);
                    } else if (textStatus === "error") {
                        try {
                            var data = JSON.parse(request.responseText);
                            if (data.code && data.message) {
                                deferred.rejectWith(context, data);
                            } else {
                                deferred.rejectWith(context, [Status.Replies.UNEXPECTED_REPLY]);
                            }
                        } catch(exception) {
                            deferred.rejectWith(context, [Status.Replies.UNEXPECTED_REPLY]);
                        }
                    } else {
                        deferred.rejectWith(context, [Status.Replies.UNEXPECTED_REPLY]);
                    }
                }
            });

            return deferred.promise();
        },

        /**
         * Signs the user out.
         *
         * @param options Optional options object. May contain the following properties:
         *                context - Context in which to execute the
         *
         * @return jQuery Deferred promise. The promise will be resolved regardless of whether the
         *         token could be invalidated at the server.
         */
        signOut: function(options) {

            options = options || {};

            var deferred = new $.Deferred();

            var settings = {
                type: "POST",
                context: this,
                dataType: "json",
                success: function() {
                    deferred.resolveWith(options.context);
                },
                error: function(request, textStatus) {
                    console.log("Error invalidating token: " + textStatus);

                    deferred.resolveWith(options.context);
                }
            };

            this.signParams(settings);
            $.ajax(BASE_URL + "auth/invalidate_token", settings);

            var self = this;
            deferred.always(function() {
                self.setSessionToken("");
            });

            return deferred.promise();
        },

        /**
         * Signs the parameters to pass to $.ajax().
         *
         * @param params Parameters object.
         */
        signParams: function(params) {

            if (this.sessionToken) {
                params.headers = params.headers || {};
                params.headers["Session-Token"] = this.sessionToken;
            }
        },

        _errorFromXhr: function(xhr, url) {

            var error = {
                code: Status.UNEXPECTED_REPLY,
                message: "Unexpected Reply"
            };

            try {
                var json = JSON.parse(xhr.responseText);
                if (json.code && json.message) {
                    error.code = json.code;
                    error.message = json.message;
                    error.response = json;
                } else {
                    console.log("Missing error code or message from: ", url);
                }
            } catch (exception) {
                if (xhr.status === 0) {
                    error.code = Status.NO_CONNECTION;
                    error.message = "No Connection";
                } else {
                    console.log("Not a valid JSON reply from: ", url);
                }
            }

            return error;
        }

    });

    return API;
});
