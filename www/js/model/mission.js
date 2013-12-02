define("model/mission", ["model"], function(Model) {

    "use strict";

    return Model.extend({

        initialize: function() {

            this.defaultShell = this.application.config.defaults.shell;
        },

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
