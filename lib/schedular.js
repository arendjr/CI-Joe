"use strict";


var _ = require("lodash");


var ONE_SECOND = 1000;
var ONE_MINUTE = 60 * ONE_SECOND;


/**
 * Schedular.
 *
 * Responsible for scheduling missions.
 */
function Schedular(commandPost) {

    /**
     * Reference to the Command Post.
     */
    this.commandPost = commandPost;

    /**
     * Reference to all missions.
     */
    this.missions = commandPost.missions;

    /**
     * Interval timer to use for scheduling jobs.
     *
     * This timer is responsible for calling _scheduleJobs() once a minute.
     */
    this.scheduleTimer = 0;

    /**
     * Starting time at which the time started running.
     *
     * This timer is used to make sure that rounding errors in the scheduling do not cause any
     * jobs to be skipped or scheduled twice.
     */
    this.time = 0;
}

_.extend(Schedular.prototype, {

    /**
     * Instructs the schedular to update its schedules.
     *
     * Should be called after the schedule of one or more missions has been updated.
     */
    updateSchedules: function() {

        var hasSchedules = _.any(this.missions, "schedule");
        if (hasSchedules) {
            if (!this.scheduleTimer) {
                this.scheduleTimer = setInterval(_.bind(this._scheduleJobs, this), ONE_MINUTE);
                this.time = Date.now();
            }
        } else {
            if (this.scheduleTimer) {
                clearInterval(this.scheduleTimer);
                this.scheduleTimer = 0;
                this.time = 0;
            }
        }
    },

    _scheduleJobs: function() {

        this.time += ONE_MINUTE;

        var currentTime = Date.now();

        if (currentTime < this.time - ONE_MINUTE) {
            // we are more than a second ahead of the system time. plausible explanations could be
            // an NTP sync, a change in DST, or a manual clock change. if the offset is large
            // (>5 min), we assume it's intentional, sync back to the system time and reschedule
            // jobs as they come along. otherwise, we stall ourselves until the difference is
            // gone.
            if (currentTime < this.time - 5 * ONE_MINUTE) {
                this.time = currentTime;
            } else {
                this.time -= ONE_MINUTE;
                return;
            }
        } else if (currentTime > this.time + ONE_MINUTE) {
            // we are more than a second behind of the system time. plausible explanations could be
            // an NTP sync, a change in DST, a manual clock change or the system has resumed from
            // sleep mode. if the offset is less than 2 minutes, we will run up to match the system
            // time again, otherwise we will sync back to the system time, but jobs that should've
            // been scheduled during the gap will be skipped.
            if (currentTime < this.time + 2 * ONE_MINUTE) {
                this._scheduleJobsForTime(this.time);
                this.time += ONE_MINUTE;
            } else {
                this.time = currentTime;
            }
        }

        this._scheduleJobsForTime(this.time);
    },

    _scheduleJobsForTime: function(time) {

        function isMatch(array, value) {
            return array instanceof Array && (array.length === 0 || array.indexOf(value) > -1);
        }

        var date = new Date(time);
        var day = date.getDay();
        var hour = date.getHours();
        var minute = date.getMinutes();

        _.each(this.missions, function(mission) {
            var schedule = mission.schedule;
            var scheduleMatches = (schedule &&
                                   isMatch(schedule.days, day) &&
                                   isMatch(schedule.hours, hour) &&
                                   isMatch(schedule.minutes, minute));
            var isAlreadyQueued = _.any(this.commandPost.jobQueue, { id: mission.id });

            if (scheduleMatches && !isAlreadyQueued) {
                this.commandPost.startJob(mission.id);
            }
        }, this);
    }

});


module.exports = Schedular;