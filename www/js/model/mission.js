define("model/mission", ["i18n", "lodash", "model"], function(i18n, _, Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.defaultShell = this.application.config.defaults.shell;

            this.set("isQueued", function() {
                return this.lastJobStatus === "queued";
            });
            this.set("isRunning", function() {
                return this.lastJobStatus === "running";
            });
            this.set("isStopped", function() {
                return this.lastJobStatus !== "queued" && this.lastJobStatus !== "running";
            });
            this.set("lastJobStatusLabelClass", function() {
                switch (this.lastJobStatus) {
                case "queued":
                case "running":
                    return "label-info";
                case "success":
                    return "label-success";
                case "failed":
                    return "label-danger";
                default:
                    return "label-default";
                }
            });
            this.set("lastJobStatusLabelText", function() {
                switch (this.lastJobStatus) {
                case "queued":
                    return i18n("Queued").toString();
                case "running":
                    return i18n("Running...").toString();
                case "success":
                    return i18n("Success").toString();
                case "failed":
                    return i18n("Failed").toString();
                default:
                    return i18n("Unavailable").toString();
                }
            });
        },

        defaults: {
            name: "",
            actions: [],
            environment: {},
            lastJobStatus: "",
            shell: "",
            assignedSlaves: []
        },

        plural: "missions",

        /**
         * Starts execution of the mission.
         */
        start: function() {

            return this.application.api.ajax(this.url() + "start", { type: "POST" });
        },

        type: "mission"

    });

});
