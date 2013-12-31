"use strict";


var _ = require("lodash");
var Schedular = require("../../lib/schedular");


function MockCommandPost() {

    this.missions = [
        {
            id: "mission0",
            schedule: {
                days: [1, 2, 3, 4, 5],
                hours: [9, 11, 13, 15, 17],
                minutes: [0, 30]
            }
        },
        {
            id: "mission1",
            schedule: {
                days: [1, 3, 5],
                hours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
                minutes: [0]
            }
        },
        {
            id: "mission2",
            schedule: {
                days: [],
                hours: [],
                minutes: [0, 15, 30, 45]
            }
        }
    ];

    this.jobQueue = [];
}

MockCommandPost.prototype.startJob = function(missionId) {

    this.jobQueue.push(_.find(this.missions, { id: missionId }));
};


module.exports = {

    setUp: function(callback) {

        this.commandPost = new MockCommandPost();
        this.schedular = new Schedular(this.commandPost);

        callback();
    },

    testPositive1: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 31, 20, 45, 0, 0);
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"), ["mission2"]);
        test.done();
    },

    testPositive2: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 30, 17, 30, 0, 0);
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"), ["mission0", "mission2"]);
        test.done();
    },

    testDoublePositive2: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 30, 17, 30, 0, 0);
        this.schedular._scheduleJobsForTime(date.getTime());
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"), ["mission0", "mission2"]);
        test.done();
    },

    testPositive3: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 30, 17, 0, 0, 0);
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"),
                       ["mission0", "mission1", "mission2"]);
        test.done();
    },

    testPositive4: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 30, 17, 30, 19, 732);
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"), ["mission0", "mission2"]);
        test.done();
    },

    testNegative1: function(test) {

        test.expect(1);
        var date = new Date(2013, 11, 30, 17, 39, 0, 0);
        this.schedular._scheduleJobsForTime(date.getTime());
        test.deepEqual(_.pluck(this.commandPost.jobQueue, "id"), []);
        test.done();
    },

    testUpdateSchedules: function(test) {

        test.expect(3);
        test.equal(this.schedular.scheduleTimer, 0);
        this.schedular.updateSchedules();
        test.notEqual(this.schedular.scheduleTimer, 0);
        this.commandPost.missions.splice(0, 3);
        this.schedular.updateSchedules();
        test.equal(this.schedular.scheduleTimer, 0);
        test.done();
    }

};
