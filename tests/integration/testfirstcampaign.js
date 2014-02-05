(function() {

    "use strict";

    var tester = require("./testerutil").newTester(casper);

    tester.start(function() {

        tester.waitForText("No campaigns available", function() {
            tester.click(".js-main .action-new");

            tester.assertExists(".js-main .js-name-input");

            tester.type(".js-name-input", "First campaign");

            // create first mission
            tester.click(".js-phases [data-phase-index='0'] .action-add-mission");
            tester.assertExists(".js-lightbox-container .js-name-input");
            tester.type(".js-lightbox-container .js-name-input", "First mission");
            tester.type(".js-lightbox-container .js-command-input", "sleep 1\n" +
                                                                    "echo First mission done");
            tester.click(".js-lightbox-container .action-save");
        });

        tester.waitForSelector(".js-phases [data-phase-index='0'] [data-mission-index='0']",
                               function() {
            tester.assertElementText(".js-phases [data-phase-index='0'] " +
                                     ".action-edit-mission[data-mission-index='0']",
                                     "First mission");

            // create second mission
            tester.click(".js-phases [data-phase-index='0'] .action-add-mission");
            tester.assertExists(".js-lightbox-container .js-name-input");
            tester.type(".js-lightbox-container .js-name-input", "Second mission");
            tester.type(".js-lightbox-container .js-command-input", "sleep 2\n" +
                                                                    "echo Second mission done");
            tester.click(".js-lightbox-container .action-save");
        });

        tester.waitForSelector(".js-phases [data-phase-index='0'] [data-mission-index='1']",
                               function() {
            tester.assertElementText(".js-phases [data-phase-index='0'] " +
                                     ".action-edit-mission[data-mission-index='1']",
                                     "Second mission");

            tester.click(".action-add-phase");

            // create third mission
            tester.click(".js-phases [data-phase-index='1'] .action-add-mission");
            tester.assertExists(".js-lightbox-container .js-name-input");
            tester.type(".js-lightbox-container .js-name-input", "Third mission");
            tester.type(".js-lightbox-container .js-command-input", "sleep 1\n" +
                                                                    "echo Third mission done");
            tester.click(".js-lightbox-container .action-save");
        });

        tester.waitForSelector(".js-phases [data-phase-index='1'] [data-mission-index='0']",
                               function() {
            tester.assertElementText(".js-phases [data-phase-index='1'] " +
                                     ".action-edit-mission[data-mission-index='0']",
                                     "Third mission");

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-campaign", function() {
            tester.assertElementCount(".action-campaign", 1);
            tester.assertExists(".action-campaign .status-unavailable");
            tester.assertElementText(".action-campaign td:nth-child(2)", "First campaign");
            tester.assertElementText(".action-campaign td:nth-child(3)", "-");
            tester.assertElementText(".action-campaign td:nth-child(4)", "-");
            tester.assertVisible(".action-campaign .action-start");
            tester.assertNotVisible(".action-campaign .action-stop");

            tester.click(".action-campaign .action-start");
        });

        tester.waitForSelector(".action-campaign .status-active", function() {
            tester.assertExists(".action-campaign .status-active");
            tester.assertNotVisible(".action-campaign .action-start");
            tester.assertVisible(".action-campaign .action-stop");

            tester.click(".action-missions");
        });

        tester.wait(500, function() {
            tester.assertElementCount(".action-mission", 3);
            tester.assertExists(".action-mission:nth-child(1) .status-running");
            tester.assertSelectorHasText(".action-mission:nth-child(1) td:nth-child(2)",
                                         "First mission");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(3)", "-");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(2) .status-running");
            tester.assertSelectorHasText(".action-mission:nth-child(2) td:nth-child(2)",
                                         "Second mission");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(3)", "-");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(3) .status-unavailable");
            tester.assertSelectorHasText(".action-mission:nth-child(3) td:nth-child(2)",
                                         "Third mission");
            tester.assertElementText(".action-mission:nth-child(3) td:nth-child(3)", "-");
            tester.assertElementText(".action-mission:nth-child(3) td:nth-child(4)", "-");
        });

        tester.wait(900, function() {
            tester.assertExists(".action-mission:nth-child(1) .status-success",
                                "1st mission should have succeeded now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(2) .status-running",
                                "2nd mission should still be running");
            tester.assertExists(".action-mission:nth-child(3) .status-unavailable",
                                "3rd mission should not have started yet");
        });

        tester.wait(900, function() {
            tester.assertExists(".action-mission:nth-child(1) .status-success",
                                "1st mission had already succeeded");
            tester.assertExists(".action-mission:nth-child(2) .status-success",
                                "2nd mission should also have succeeded now");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(3) .status-running",
                                "3rd mission should be running now");
        });

        tester.wait(900, function() {
            tester.assertExists(".action-mission:nth-child(1) .status-success",
                                "1st mission had already succeeded");
            tester.assertExists(".action-mission:nth-child(2) .status-success",
                                "2nd mission had already succeeded");
            tester.assertExists(".action-mission:nth-child(3) .status-success",
                                "3rd mission should also have succeeded now");
            tester.assertElementText(".action-mission:nth-child(3) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(3) td:nth-child(4)", "-");

            tester.click(".action-campaigns");
        });

        tester.waitForSelector(".js-main .action-campaign", function() {
            tester.assertElementCount(".action-campaign", 1);
            tester.assertExists(".action-campaign .status-success");
            tester.assertElementText(".action-campaign td:nth-child(2)", "First campaign");
            tester.assertElementText(".action-campaign td:nth-child(3)", "Just now");
            tester.assertElementText(".action-campaign td:nth-child(4)", "-");
            tester.assertVisible(".action-campaign .action-start");
            tester.assertNotVisible(".action-campaign .action-stop");

            tester.click(".action-campaign .action-start");
        });

        tester.waitForSelector(".action-campaign .status-active", function() {
            tester.assertExists(".action-campaign .status-active");
            tester.assertNotVisible(".action-campaign .action-start");
            tester.assertVisible(".action-campaign .action-stop");

            tester.click(".action-missions");
        });

        tester.wait(500, function() {
            tester.assertElementCount(".action-mission", 3);
            tester.assertExists(".action-mission:nth-child(1) .status-running");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(2) .status-running");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(3) .status-success");
            tester.assertElementText(".action-mission:nth-child(3) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
        });

        tester.wait(900, function() {
            tester.assertExists(".action-mission:nth-child(1) .status-success");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(1) td:nth-child(4)", "-");
            tester.assertExists(".action-mission:nth-child(2) .status-running");
            tester.assertExists(".action-mission:nth-child(3) .status-success");

            tester.click(".action-mission:nth-child(2) .action-stop");
        });

        tester.waitForSelector(".action-mission:nth-child(2) .status-failed", function() {
            tester.assertExists(".action-mission:nth-child(1) .status-success");
            tester.assertExists(".action-mission:nth-child(2) .status-failed");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(3)", "Just now");
            tester.assertElementText(".action-mission:nth-child(2) td:nth-child(4)", "Just now");
            tester.assertExists(".action-mission:nth-child(3) .status-success");

            tester.click(".action-campaigns");
        });

        tester.waitForSelector(".js-main .action-campaign", function() {
            tester.assertElementCount(".action-campaign", 1);
            tester.assertExists(".action-campaign .status-failed");
            tester.assertElementText(".action-campaign td:nth-child(2)", "First campaign");
            tester.assertElementText(".action-campaign td:nth-child(3)", "Just now");
            tester.assertElementText(".action-campaign td:nth-child(4)", "Just now");
            tester.assertVisible(".action-campaign .action-start");
            tester.assertNotVisible(".action-campaign .action-stop");

            tester.click(".action-campaign .action-remove");
        });

        tester.waitForSelector(".modal .action-confirm", function() {
            tester.click(".action-confirm");
        });

        tester.waitWhileSelector(".modal", function() {
            tester.assertElementCount(".action-campaign", 0);
            tester.assertTextExists("No campaigns available.");

            tester.click(".action-missions");
        });

        tester.wait(50, function() {
            tester.assertElementCount(".action-mission", 0);
            tester.assertTextExists("No missions available.");
        });
    });

    casper.run();

})();
