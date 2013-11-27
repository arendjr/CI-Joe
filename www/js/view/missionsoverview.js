define("view/missionsoverview",
       ["continuouspager", "jquery", "tmpl/missionitem", "tmpl/missionsoverview"],
       function(ContinuousPager, $, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.itemTemplate = tmpl.missionitem;

            this.template = tmpl.missionsoverview;
        }

    });

});
