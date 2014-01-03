define("model/campaign", ["i18n", "lodash", "model"], function(i18n, _, Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("scheduleOptionsChevron", function() {
                return "fa-chevron-" + (this.scheduleOptionsExpanded ? "down" : "right");
            });
        },

        defaults: {
            name: "",
            phases: [],
            runs: [],
            schedule: null,
            scheduleOptionsExpanded: false,
            workspaces: []
        },

        plural: "campaigns",

        /**
         * Starts execution of the campaign.
         */
        start: function() {

            return this.application.api.ajax(this.url() + "start", { type: "POST" });
        },

        type: "campaign"

    });

});
