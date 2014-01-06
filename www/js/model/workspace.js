define("model/workspace", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        defaults: {
            name: ""
        },

        plural: "workspaces",

        type: "workspace"

    });

});
