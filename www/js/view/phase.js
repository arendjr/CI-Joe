define("view/phase", ["lodash", "view", "tmpl/phase"], function(_, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.campaign = options.campaign;

            this.phase = options.phase;

            this.index = options.index;

            this._missions = [];
        },

        events: {
            "click .action-add-mission": "_addMission",
            "click .action-confirm-changes": "_confirmChanges",
            "click .action-delete-mission": "_deleteMission",
            "click .action-discard-changes": "_discardChanges",
            "click .action-edit-mission": "_editMission",
            "click .action-edit-phase": "_editPhase"
        },

        render: function(options) {

            options = options || {};

            var data = _.extend(this.phase, { editable: options.editable, id: this.index + 1 });
            return this.$el.addClass("phase")
                           .attr("data-phase-index", this.index)
                           .html(tmpl.phase(data));
        },

        _addMission: function() {

            this.openLightbox("EditMission", {
                campaign: this.campaign,
                context: this,
                saveModel: false
            }).then(function(mission) {
                this.phase.missions.push(mission);
                this.render();
            });
        },

        _confirmChanges: function() {

            this._missions = [];

            this.render();
        },

        _deleteMission: function(event) {

            var index = this.targetData(event, "mission-index");

            this.phase.missions.splice(index, 1);

            this.render({ editable: true });
        },

        _discardChanges: function() {

            this.phase.missions = this._missions;
            this._missions = [];

            this.render();
        },

        _editMission: function(event) {

            var index = this.targetData(event, "mission-index");
            var mission = this.phase.missions[index];

            this.openLightbox("EditMission", {
                context: this,
                mission: mission,
                saveModel: false
            }).then(function(updatedMission) {
                mission.set(updatedMission);
                this.render();
            });
        },

        _editPhase: function() {

            this._missions = _.clone(this.phase.missions);

            this.render({ editable: true });
        }

    });

});
