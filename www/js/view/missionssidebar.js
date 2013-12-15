define("view/missionssidebar",
       ["continuouspager", "tmpl/missionssidebar", "tmpl/missionssidebaritem"],
       function(ContinuousPager, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.missions;

            this.itemTemplate = tmpl.missionssidebaritem;

            this.template = tmpl.missionssidebar;
        },

        events: {
            "click .action-edit": "_edit",
            "click .action-new": "_new"
        },

        _edit: function(event) {

            var id = this.targetData(event, "item-id");
            var mission = this.collection.find({ id: id });
            this.openLightbox("EditMission", { mission: mission });
        },

        _new: function() {

            this.openLightbox("EditMission");
        }

    });

});
