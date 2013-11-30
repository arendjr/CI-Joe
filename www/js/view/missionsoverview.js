define("view/missionsoverview",
       ["continuouspager", "jquery", "tmpl/missionitem", "tmpl/missionsoverview",
        "tmpl/nomissions"],
       function(ContinuousPager, $, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.emptyTemplate = tmpl.nomissions;

            this.itemTemplate = tmpl.missionitem;

            this.template = tmpl.missionsoverview;
        },

        events: {
            "click .action-new": "_new"
        },

        _new: function() {

            this.openLightbox("EditMission");
        }

    });

});
