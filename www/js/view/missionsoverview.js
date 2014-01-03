define("view/missionsoverview",
       ["i18n", "continuouspager", "jquery", "tmpl/missionitem", "tmpl/missionsoverview",
        "tmpl/nomissions"],
       function(i18n, ContinuousPager, $, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.emptyTemplate = tmpl.nomissions;

            this.itemTemplate = tmpl.missionitem;

            this.template = tmpl.missionsoverview;
        },

        events: {
            "click .action-edit": "_edit",
            "click .action-new": "_new",
            "click .action-remove": "_remove"
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

        _edit: function(event) {

            var mission = this.collections.get(this.targetData(event, "mission-id"));
            this.openLightbox("EditMission", { mission: mission });
        },

        _new: function() {

            this.openLightbox("EditMission");
        },

        _remove: function(event) {

            var $action = this.$(".action-remove");
            $action.html($("<i>").addClass("fa fa-refresh fa-spin"));

            var mission = this.collections.get(this.targetData(event, "mission-id"));

            this.application.confirm(i18n("Are you sure you want to remove the mission <b>%1</b>?")
                                     .arg(mission.name), {
                context: this,
                title: i18n("Remove mission")
            }).then(function() {
                mission.remove({ context: this }).fail(function(error) {
                    this.showError(i18n("Could not remove the mission"), error);
                });
            });
        }

    });

});
