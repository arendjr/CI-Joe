define("view/mission",
       ["laces.tie", "lodash", "view", "tmpl/joboutput", "tmpl/mission"],
       function(Laces, _, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.mission = options.mission;
            this.mission.jobs.on("add", this._onNewJobs, { context: this });

            this.subscribe("server-push:missions:update-results", this._onResults);

            this.$jobs = null;
        },

        events: {
            "click .action-expand-job": "_expandJob"
        },

        remove: function() {

            this.mission.jobs.off("add", this._onNewJobs);
        },

        render: function() {

            var lastJob = this.mission.lastJob;
            if (lastJob) {
                lastJob.expanded = true;
                lastJob.fetchResults({ context: this }).then(function() {
                    var tie = new Laces.Tie(lastJob, tmpl.joboutput);
                    var $jobOutput = this.$(".js-job-output[data-job-id='" + lastJob.id + "']");
                    $jobOutput.replaceWith(tie.render());
                });
            }

            var tie = new Laces.Tie(this.mission, tmpl.mission);
            this.$el.html(tie.render());

            this.$jobs = this.$(".js-jobs");
            _.each(this.mission.jobs, _.bind(this._renderJob, this));

            return this.$el;
        },

        _expandJob: function(event) {

            var jobId = this.targetData(event, "job-id");
            var job = _.find(this.mission.jobs, { id: jobId });
            job.expanded = !job.expanded;

            if (job.expanded) {
                job.fetchResults();
            }
        },

        _onNewJobs: function(event) {

            _.each(event.elements, _.bind(this._renderJob, this));
        },

        _onResults: function(data) {

            if (data.missionId === this.mission.id) {
                var job = _.find(this.mission.jobs, { id: data.jobId });
                if (job) {
                    job.actionResults = data.actionResults;
                    job.status = data.status;

                    if (job.expanded) {
                        var tie = new Laces.Tie(job, tmpl.joboutput);
                        var $jobOutput = this.$(".js-job-output[data-job-id='" + job.id + "']");
                        $jobOutput.replaceWith(tie.render());
                    }
                }
            }
        },

        _renderJob: function(job) {

            if (this.$jobs) {
                var tie = new Laces.Tie(job, tmpl.joboutput);
                this.$jobs.prepend(tie.render());
            }
        }

    });

});
