define("view/missionsoverview",
       ["continuouspager", "jquery", "lightbox/editmission", "tmpl/missionitem",
        "tmpl/missionsoverview"],
       function(ContinuousPager, $, EditMissionLightbox, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.itemTemplate = tmpl.missionitem;

            this.template = tmpl.missionsoverview;
        },

        events: {
            "click .action-new": "_new",
            "click .action-remove": "_remove"
        },

        _new: function() {

            var lightbox = new EditMissionLightbox(this);
            this.application.openLightbox(lightbox);
        },

        _remove: function(event) {

            var id = $(event.target).closest("[data-item-id]").data("item-id");
            var mission = this.collection.find({ id: id });
            mission.remove();
        }

    });

});
