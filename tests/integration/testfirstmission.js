(function() {

    "use strict";

    var casper = require("casper").create();
    var tester = require("./tests/tester").newTester(casper);

    tester.start("groups", ["mock=1", "reply_timeout=10", "token=token0123456789"], function() {

        tester.waitForSelector(".action-group[data-group-id='gHelden']", function() {
            tester.assertElementCount(".page .action-group", 3);

            tester.click(".js-tab-handle[data-tab-id='all']");
        });

        tester.wait(30, function() {
            tester.assertElementCount(".page .action-group", 13);

            tester.type(".page .js-search-input", "engineers");

            tester.assertElementCount(".page .action-group", 2);

            tester.type(".page .js-search-input", "");

            tester.assertElementCount(".page .action-group", 13);

            tester.click(".action-group[data-group-id='gGamebase']");
        });

        tester.wait(30, function() {
            tester.assertTextExists("This group does no longer exist.");

            tester.back();
        });

        tester.wait(30, function() {
            tester.assertElementCount(".page .action-group", 13);

            tester.click(".action-group[data-group-id='gDeviant']");
        });

        tester.wait(30, function() {
            tester.assertTextExists("Paint it black, or like black velvet");

            tester.click(".js-tabs .action-dropdown-toggle");

            tester.click(".action-delete");

            tester.assertTextExists("Are you sure you want to delete the group");

            tester.click(".js-confirm-button");
        });

        tester.wait(30, function() {
            tester.assertTextExists("The group has been deleted");
            tester.assertElementCount(".page .action-group", 12);

            tester.click(".js-tab-handle[data-tab-id='mine']");
        });

        tester.wait(30, function() {
            tester.assertElementCount(".page .action-group", 3);

            tester.emitGroupMembershipUpdate("my_memberships:uArend:nUSGP", {
                event: "create",
                group: "gElite",
                role: "invitee",
                user: "uArend"
            });
        });

        tester.wait(30, function() {
            tester.assertElementCount(".page .action-group", 4);

            tester.assertTextExists("elite commanders");
        });

    });

    casper.run();

})();
