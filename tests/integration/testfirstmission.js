(function() {

    "use strict";

    var casper = require("casper").create({ viewportSize: { width: 1024, height: 768 } });
    var tester = require("./tests/integration/tester").newTester(casper);

    tester.start(function() {

        tester.waitForSelector(".action-missions", function() {
            tester.click(".action-missions");

            tester.assertExists(".js-main .js-empty-placeholder");

            tester.click(".js-main .action-new");
        });

        tester.waitForSelector(".modal .js-name-input", function() {
            tester.type(".js-name-input", "Test mission");
            tester.type(".js-command-input",
                        "sleep 1\n" +
                        "echo Waited 1 second\n" +
                        "sleep 1\n" +
                        "echo Waited 2 seconds");

            tester.click(".action-save");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.assertElementCount(".action-mission", 1);
            tester.assertSelectorHasText(".action-mission", "Test mission");
            tester.assertExists(".action-mission .status-unavailable");
            tester.assertVisible(".action-mission .action-start-mission");

            tester.click(".action-start-mission");
        });

        tester.wait(500, function() {
            tester.assertNotVisible(".action-mission .action-start-mission");
        });

        tester.wait(2000, function() {
            tester.assertDoesntExist(".action-mission .status-unavailable");
            tester.assertExists(".action-mission .status-success");

            tester.assertVisible(".action-mission .action-start-mission");

            tester.click(".action-mission");
        });

        tester.waitForSelector(".js-main h2", function() {
            tester.assertSelectorHasText(".js-main", "Command exited with exit code 0");

            tester.assertSelectorHasText(".js-main pre", "Waited 1 second");
            tester.assertSelectorHasText(".js-main pre", "Waited 2 seconds");

            tester.click(".action-home");
        });

        tester.waitForSelector(".js-main .action-mission", function() {
            tester.click(".action-mission .action-remove");
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
