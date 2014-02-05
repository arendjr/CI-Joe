(function() {

    "use strict";

    var tester = require("./testerutil").newTester(casper);

    tester.start(function() {

        tester.waitForText("No campaigns available", function() {
            tester.click(".js-main .action-new");

            tester.assertExists(".js-main .js-name-input");

            tester.type(".js-name-input", "First campaign");

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-campaign", function() {
            tester.click(".js-main .action-campaign .action-edit");

            tester.assertExists(".js-main .js-name-input");

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

            tester.click(".action-missions");
        });

        tester.wait(500, function() {
            tester.assertElementCount(".action-mission", 3);
            tester.assertSelectorHasText(".action-mission:nth-child(1) td:nth-child(2)",
                                         "First mission");
            tester.assertSelectorHasText(".action-mission:nth-child(2) td:nth-child(2)",
                                         "Second mission");
            tester.assertSelectorHasText(".action-mission:nth-child(3) td:nth-child(2)",
                                         "Third mission");

            tester.click(".action-campaigns");
        });

        tester.waitForSelector(".js-main .action-campaign", function() {
            tester.assertElementCount(".action-campaign", 1);

            tester.click(".action-campaign .action-remove");
        });

        tester.waitForSelector(".modal .action-confirm", function() {
            tester.click(".action-confirm");
        });

        tester.waitWhileSelector(".action-campaign", function() {
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
