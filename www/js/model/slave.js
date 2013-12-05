define("model/slave", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("statusIcon", function() {
                switch (this.connectedState) {
                case "connected":
                    return "ok-circle";
                case "busy":
                    return "player-circle";
                default:
                    return "off";
                }
            });
        },

        defaults: {
            name: "",
            type: "",
            applicability: "general",
            connectedState: "disconnected"
        },

        plural: "slaves",

        type: "slave"

    });

});
