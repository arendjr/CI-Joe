define("model/mission", ["i18n", "model"], function(i18n, Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.defaultShell = this.application.config.defaults.shell;

            this.set("lastJobStatusLabelClass", function() {
                switch (this.lastJobStatus) {
                case "success":
                    return "label-success";
                case "failed":
                    return "label-danger";
                case "running":
                    return "label-info";
                default:
                    return "label-default";
                }
            });
            this.set("lastJobStatusLabelText", function() {
                switch (this.lastJobStatus) {
                case "success":
                    return i18n("Success");
                case "failed":
                    return i18n("Failed");
                case "running":
                    return i18n("Running...");
                default:
                    return i18n("Unavailable");
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

        type: "mission"

    });

});
