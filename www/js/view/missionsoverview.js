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
            "click .action-new": "_new",
            "mouseover .action-mission": "_hoverMission",
            "mouseout .action-mission": "_leaveMission"
        },

        _hoverMission: function(event) {

            var $mission = $(event.target).closest(".action-mission");
            $mission.find(".js-hover").show();
            $mission.find(".js-no-hover").hide();
        },

        _leaveMission: function(event) {

            var $mission = $(event.target).closest(".action-mission");
            $mission.find(".js-hover").hide();
            $mission.find(".js-no-hover").show();
        },

        _new: function() {

            this.openLightbox("EditMission");
        }

    });

});
