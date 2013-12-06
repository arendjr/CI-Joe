define("model/slave", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.set("statusIcon", function() {
                switch (this.connectedState) {
                case "connected":
                    return "glyphicon-ok-circle";
                case "busy":
                    return "glyphicon-player-circle";
                default:
                    return "glyphicon-off";
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
