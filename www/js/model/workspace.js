define("model/workspace", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        defaults: {
            name: "",
            type: "empty"
        },

        plural: "workspaces",

        type: "workspace"

    });

});
