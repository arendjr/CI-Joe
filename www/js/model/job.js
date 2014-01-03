define("model/job", ["i18n", "lodash", "model"], function(i18n, _, Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("chevron", function() {
                return "glyphicon-chevron-" + (this.expanded ? "down" : "right");
            });

            this.set("isQueued", function() {
                return this.status === "queued";
            });
            this.set("isRunning", function() {
                return this.status === "running";
            });
            this.set("isStopped", function() {
                return this.status !== "queued" && this.status !== "running";
            });
            this.set("statusLabelClass", function() {
                switch (this.status) {
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
            this.set("statusLabelText", function() {
                switch (this.status) {
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
            assignedSlave: "",
            expanded: false,
            missionId: "",
            results: {},
            status: ""
        },

        fetchResults: function(options) {

            options = options || {};

            var url = _.result(this, "url") + "results/";

            var self = this;
            var promise = this.application.api.ajax(url, { context: options.context });
            promise.then(function(data) {
                self.results = data.results;
            });
            return promise;
        },

        plural: "jobs",

        type: "job",

        url: function() {

            return "missions/" + this.missionId + "/jobs/" + this.id + "/";
        }

    });

});
