define("view/missionsoverview",
       ["i18n", "continuouspager", "jquery", "laces", "timestamps", "tmpl/missionitem",
        "tmpl/missionsoverview", "tmpl/nomissions"],
       function(i18n, ContinuousPager, $, Laces, Timestamps, tmpl) {

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
            "click .action-remove": "_remove",
            "click .action-start": "_start",
            "click .action-stop": "_stop"
        },

        renderItem: function(model) {

            var data = model;

            if (model.campaigns.length === 1) {
                var campaign = this.application.campaigns.get(model.campaigns[0]);
                if (campaign) {
                    model.campaignName = campaign.name;
                }
            }

            var tie = new Laces.Tie(data, this.itemTemplate);
            var $el = $(tie.render()).children();

            $el.attr("data-item-id", model.id);

            Timestamps.process($el.find("[data-timestamp]"));

            return $el;
        },

        _edit: function(event) {

            var mission = this.collection.get(this.targetData(event, "mission-id"));
            this.openLightbox("EditMission", { mission: mission });
            return false;
        },

        _new: function() {

            this.openLightbox("EditMission");
        },

        _remove: function(event) {

            var mission = this.collection.get(this.targetData(event, "mission-id"));

            this.application.confirm(i18n("Are you sure you want to remove the mission <b>%1</b>?")
                                     .arg(mission.name), {
                context: this,
                title: i18n("Remove mission")
            }).then(function() {
                var $action = $(event.target).closest(".action-remove");
                $action.removeClass("icon-trash").addClass("icon-refresh fa-spin");

                mission.remove({ context: this }).fail(function(error) {
                    $action.removeClass("icon-refresh fa-spin").addClass("icon-trash");

                    this.showError(i18n("Could not remove the mission"), error);
                });
            });
            return false;
        },

        _start: function(event) {

            var mission = this.collection.get(this.targetData(event, "mission-id"));
            mission.start();
            return false;
        },

        _stop: function(event) {

            var mission = this.collection.get(this.targetData(event, "mission-id"));
            mission.stop();
            return false;
        }

    });

});
