"use strict";


var Missions = require("../../lib/missions");


module.exports = {

    setUp: function(callback) {

        this.missions = new Missions({ missions: [] });

        callback();
    },

    testAddMission: function(test) {

        test.expect(5);

        var missionData = {
            campaigns: ["campaign0"],
            command: "test",
            name: "Test mission",
            standalone: false
        };

        var mission = this.missions.add(missionData);

        test.deepEqual(mission.campaigns, ["campaign0"]);
        test.deepEqual(mission.command, "test");
        test.deepEqual(mission.name, "Test mission");
        test.deepEqual(mission.shell, "");
        test.deepEqual(mission.standalone, false);

        test.done();
    }

};
