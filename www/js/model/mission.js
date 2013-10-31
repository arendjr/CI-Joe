define("model/mission", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        defaults: {
            name: "",
            actions: [],
            environment: {},
            shell: "",
            assignedSlaves: []
        },

        plural: "missions",

        type: "mission"

    });

});
