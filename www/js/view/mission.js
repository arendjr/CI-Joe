define("view/mission",
       ["jquery", "laces.tie", "lodash", "view", "tmpl/joboutput", "tmpl/mission"],
       function($, Laces, _, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.mission = options.mission;
            this.mission.jobs.on("add", this._onNewJobs, { context: this });

            this.subscribe("server-push:missions:job-output", this._onJobOutput);

            this.$jobs = null;
        },

        events: {
            "click .action-expand-job": "_expandJob"
        },

        remove: function() {

            this.mission.jobs.off("add", this._onNewJobs);
        },

        render: function() {

            var lastJob = this.mission.jobs[this.mission.jobs.length - 1];
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

        _onJobOutput: function(data) {

            if (data.missionId === this.mission.id) {
                var job = _.find(this.mission.jobs, { id: data.jobId });
                if (job && job.expanded) {
                    var $output = this.$(".js-job-output[data-job-id=" + $.jsEscape(data.jobId) +
                                         "] .js-output");
                    if ($output.length) {
                        $output[0].innerHTML += $.colored(data.output);
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
