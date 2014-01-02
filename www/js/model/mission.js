define("model/mission", ["i18n", "lodash", "model", "model/job"], function(i18n, _, Model, Job) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.defaultShell = this.application.config.defaults.shell;

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

            this.set("lastJob", function() {
                return this.jobs[this.jobs.length - 1];
            });
            this.set("lastJobStatus", function() {
                return this.lastJob ? this.lastJob.status : "n/a";
            });
            this.set("lastJobStatusLabelClass", function() {
                return this.lastJob ? this.lastJob.statusLabelClass : "label-default";
            });
            this.set("lastJobStatusLabelText", function() {
                return this.lastJob ? this.lastJob.statusLabelText : i18n("Unavailable").toString();
            });
            this.set("isQueued", function() {
                return this.lastJob ? this.lastJob.isQueued : false;
            });
            this.set("isRunning", function() {
                return this.lastJob ? this.lastJob.isRunning : false;
            });
            this.set("isStopped", function() {
                return this.lastJob ? this.lastJob.isStopped : true;
            });
        },

        defaults: {
            actions: [],
            assignedSlaves: [],
            environment: {},
            isQueued: false,
            isRunning: false,
            isStopped: true,
            jobs: [],
            lastJob: undefined,
            lastJobStatus: "n/a",
            lastJobStatusLabelClass: "",
            lastJobStatusLabelText: "",
            name: "",
            schedule: null,
            shell: ""
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
