define("model/mission", ["i18n", "lodash", "model", "model/job"], function(i18n, _, Model, Job) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.defaultShell = this.application.config.defaults.shell;

            this.set("advancedOptionsChevron", function() {
                return "fa-chevron-" + (this.advancedOptionsExpanded ? "down" : "right");
            });

            var self = this;
            this.set("jobs", this.jobs, { setFilter: function(jobs) {
                return _.map(jobs, function(job) {
                    if (job instanceof Job) {
                        return job;
                    } else {
                        var existingJob = _.find(self.jobs, { id: job.id });
                        if (existingJob && existingJob instanceof Job) {
                            existingJob.set(_.omit(job, "id"));
                            return existingJob;
                        } else {
                            return new Job(self.application, _.extend({ missionId: self.id }, job));
                        }
                    }
                });
            }});

            this.set("statusClass", function() {
                return "status-" + this.status;
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
        },

        defaults: {
            advancedOptionsExpanded: false,
            assignedSlaves: [],
            campaigns: [],
            command: "",
            environment: {},
            isQueued: false,
            isRunning: false,
            isStopped: true,
            jobs: [],
            lastFailure: 0,
            lastSuccess: 0,
            name: "",
            shell: "",
            standalone: true,
            status: "unavailable",
            timeout: 0,
            workspace: ""
        },

        plural: "missions",

        serializableProperties: [
            "assignedSlaves",
            "command",
            "environment",
            "name",
            "shell",
            "timeout",
            "workspace",
            "workspaceName"
        ],

        /**
         * Starts execution of the mission.
         */
        start: function() {

            return this.application.api.ajax(this.url() + "start", { type: "POST" });
        },

        toJSON: function() {

            var json = Model.prototype.toJSON.call(this);
            if (this.workspace instanceof Model) {
                json.workspace = this.workspace.toJSON();
            }
            return json;
        },

        type: "mission"

    });

});
