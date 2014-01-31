define("model/campaign", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("advancedOptionsChevron", function() {
                return "fa-chevron-" + (this.advancedOptionsExpanded ? "down" : "right");
            });

            this.set("isActive", function() {
                return this.status === "active";
            });
            this.set("statusClass", function() {
                return "status-" + this.status;
            });
        },

        defaults: {
            advancedOptionsExpanded: false,
            name: "",
            phases: [],
            runs: [],
            schedule: null,
            workspaces: []
        },

        plural: "campaigns",

        serializableProperties: [
            "name",
            "phases",
            "schedule",
            "workspaces"
        ],

        /**
         * Starts execution of the campaign.
         */
        start: function() {

            return this.application.api.ajax(this.url() + "start", { type: "POST" });
        },

        type: "campaign"

    });

});
