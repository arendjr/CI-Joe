(function() {

    "use strict";

    var casper = require("casper").create({ viewportSize: { width: 1024, height: 768 } });
    var tester = require("./tests/integration/tester").newTester(casper);

    tester.start(function() {

        tester.waitForSelector(".js-main .action-new", function() {
            tester.click(".js-main .action-new");
        });

        tester.waitForSelector(".modal .action-toggle-schedule", function() {
            tester.click(".action-toggle-schedule");

            tester.click("input[type=radio][value='hourly']");

            tester.type(".js-hourly-minute", "15");
            tester.type(".js-except-hour-start", "22:00");
            tester.type(".js-except-hour-end", "07:00");
            tester.selectMultiple(".js-hourly-excluded-days",
                    [{ id: 2, text: "Tuesday"}, { id: 4, text: "Thursday" }]);

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.wait(100, function() {
                tester.click(".action-edit");
            });
        });

        tester.waitForSelector(".modal .action-toggle-schedule", function() {
            tester.assertElementChecked("input[type=radio][value='hourly']");

            tester.assertElementValue(".js-hourly-minute", "15");
            tester.assertElementValue(".js-except-hour-start", "22:00");
            tester.assertElementValue(".js-except-hour-end", "07:00");
            tester.assertSelection(".js-hourly-excluded-days",
                    [{ id: 2, text: "Tuesday"}, { id: 4, text: "Thursday" }]);

            tester.click("input[type=radio][value='daily']");

            tester.type(".js-daily-time", "12:30");
            tester.selectMultiple(".js-daily-excluded-days",
                    [{ id: 2, text: "Wednesday"}, { id: 4, text: "Sunday" }]);

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.wait(100, function() {
                tester.click(".action-edit");
            });
        });

        tester.waitForSelector(".modal .action-toggle-schedule", function() {
            tester.assertElementChecked("input[type=radio][value='daily']");

            tester.assertElementValue(".js-daily-time", "12:30");
            tester.assertSelection(".js-daily-excluded-days",
                    [{ id: 2, text: "Wednesday"}, { id: 4, text: "Sunday" }]);

            tester.click("input[type=radio][value='weekly']");

            tester.select(".js-weekly-daily", 1, "Monday");
            tester.type(".js-weekly-time", "14:45");

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.wait(100, function() {
                tester.click(".action-edit");
            });
        });

        tester.waitForSelector(".modal .action-toggle-schedule", function() {
            tester.assertElementChecked("input[type=radio][value='weekly']");

            tester.assertSelection(".js-weekly-daily", { id: 1, text: "Monday" });
            tester.assertElementValue(".js-weekly-time", "14:45");

            tester.click("input[type=radio][value='custom']");

            tester.selectMultiple(".js-custom-days",
                    [{ id: 1, text: "Monday" }, { id: 2, text: "Tuesday" }]);
            tester.selectMultiple(".js-custom-hours",
                    [{ id: 3, text: "3" }, { id: 4, text: "4" }, { id: 5, text: "5" }]);
            tester.selectMultiple(".js-custom-minutes",
                    [{ id: 0, text: "00" }, { id: 30, text: "30" }]);

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.wait(100, function() {
                tester.click(".action-edit");
            });
        });
s
        tester.waitForSelector(".modal .action-toggle-schedule", function() {
            tester.assertElementChecked("input[type=radio][value='custom']");

            tester.assertSelection(".js-custom-days",
                    [{ id: 1, text: "Monday" }, { id: 2, text: "Tuesday" }]);
            tester.assertSelection(".js-custom-hours",
                    [{ id: 3, text: "3" }, { id: 4, text: "4" }, { id: 5, text: "5" }]);
            tester.assertSelection(".js-custom-minutes",
                    [{ id: 0, text: "00" }, { id: 30, text: "30" }]);

            tester.click(".action-remove");
        });

        tester.waitForSelector(".modal .action-confirm", function() {
            tester.click(".action-confirm");
        });

        tester.waitWhileSelector(".modal", function() {
            tester.assertElementCount(".action-mission", 0);
        });
    });

    casper.run();

})();
