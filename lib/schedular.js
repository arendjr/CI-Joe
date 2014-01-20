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
     * Reference to all campaigns.
     */
    this.campaigns = commandPost.campaigns;

    /**
     * Reference to the Command Post.
     */
    this.commandPost = commandPost;

    /**
     * Interval timer to use for scheduling campaigns.
     *
     * This timer is responsible for calling _scheduleCampaigns() once a minute.
     */
    this.scheduleTimer = 0;

    /**
     * Starting time at which the time started running.
     *
     * This timer is used to make sure that rounding errors in the scheduling do not cause any
     * campaigns to be skipped or scheduled twice.
     */
    this.time = 0;
}

_.extend(Schedular.prototype, {

    /**
     * Instructs the schedular to update its schedules.
     *
     * Should be called after the schedule of one or more campaigns has been updated.
     */
    updateSchedules: function() {

        var hasSchedules = this.campaigns.any("schedule");
        if (hasSchedules) {
            if (!this.scheduleTimer) {
                this.scheduleTimer = setInterval(_.bind(this._scheduleCampaigns, this), ONE_MINUTE);
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

    _scheduleCampaigns: function() {

        this.time += ONE_MINUTE;

        var currentTime = Date.now();

        if (currentTime < this.time - ONE_MINUTE) {
            // we are more than a second ahead of the system time. plausible explanations could be
            // an NTP sync, a change in DST, or a manual clock change. if the offset is large
            // (>5 min), we assume it's intentional, sync back to the system time and reschedule
            // campaigns as they come along. otherwise, we stall ourselves until the difference is
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
            // time again, otherwise we will sync back to the system time, but campaigns that
            // should've been scheduled during the gap will be skipped.
            if (currentTime < this.time + 2 * ONE_MINUTE) {
                this._scheduleCampaignsForTime(this.time);
                this.time += ONE_MINUTE;
            } else {
                this.time = currentTime;
            }
        }

        this._scheduleCampaignsForTime(this.time);
    },

    _scheduleCampaignsForTime: function(time) {

        function isMatch(array, value) {
            return array instanceof Array && (array.length === 0 || array.indexOf(value) > -1);
        }

        var date = new Date(time);
        var day = date.getDay();
        var hour = date.getHours();
        var minute = date.getMinutes();

        this.campaigns.each(function(campaign) {
            var schedule = campaign.schedule;
            var scheduleMatches = (schedule &&
                                   isMatch(schedule.days, day) &&
                                   isMatch(schedule.hours, hour) &&
                                   isMatch(schedule.minutes, minute));
            var isAlreadyQueued = _.any(this.commandPost.activeCampaigns, { id: campaign.id });

            if (scheduleMatches && !isAlreadyQueued) {
                this.commandPost.startCampaign(campaign.id);
            }
        }, this);
    }

});


module.exports = Schedular;
