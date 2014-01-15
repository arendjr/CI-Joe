define("model/campaign", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("advancedOptionsChevron", function() {
                return "fa-chevron-" + (this.advancedOptionsExpanded ? "down" : "right");
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

        /**
         * Starts execution of the campaign.
         */
        start: function() {

            return this.application.api.ajax(this.url() + "start", { type: "POST" });
        },

        toJSON: function() {

            var json = Model.prototype.toJSON.apply(this, arguments);
            delete json.advancedOptionsExpanded;
            delete json.advancedOptionsChevron;
            return json;
        },

        type: "campaign"

    });

});
