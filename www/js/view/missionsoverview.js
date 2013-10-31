define("view/missionsoverview",
       ["continuouspager", "lightbox/editmission", "tmpl/missionitem", "tmpl/missionsoverview"],
       function(ContinuousPager, EditMissionLightbox, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.itemTemplate = tmpl.missionitem;

            this.template = tmpl.missionsoverview;
        },

        events: {
            "click .action-new": "_new"
        },

        _new: function() {

            var lightbox = new EditMissionLightbox(this);
            this.application.openLightbox(lightbox);
        }

    });

});
