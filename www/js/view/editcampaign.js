define("view/editcampaign",
       ["i18n", "laces", "lodash", "view", "view/phase", "view/scheduleoptions",
        "tmpl/editcampaign", "tmpl/nophases"],
       function(i18n, Laces, _, View, PhaseView, ScheduleOptionsView,
                tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.buttons = [
                { label: i18n("Cancel"), extraClass: "action-close", data: { dismiss: "modal" } },
                { label: i18n("Save"), extraClass: "action-save btn-primary" }
            ];

            var campaign = this.createModel("campaign");
            campaign.set(options.campaign);
            this.campaign = campaign;

            campaign.workspaces = _.map(campaign.workspaces, function(workspace) {
                return (typeof workspace === "string" ? this.application.workspaces.get(workspace)
                                                      : workspace);
            });

            this.scheduleOptions = null;

            this.subscribe(campaign.phases, "add", "_onPhaseAdded");
            this.subscribe(campaign.phases, "remove", "_onPhaseRemoved");
        },

        events: {
            "click .action-add-phase": "_addPhase",
            "click .action-remove-phase": "_removePhase",
            "click .action-cancel": "_cancel",
            "click .action-save": "_save",
            "click .action-toggle-advanced": "_toggleAdvanced"
        },

        render: function() {

            this.removeChildren();

            var tie = new Laces.Tie(this.campaign, tmpl.editcampaign);
            this.$el.html(tie.render());

            this.scheduleOptions = new ScheduleOptionsView(this, { model: this.campaign });
            this.$(".js-schedule").html(this.scheduleOptions.render());

            this._renderPhases();

            return this.$el;
        },

        _addPhase: function() {

            this.campaign.phases.push({
                continueAfterFailure: false,
                missions: []
            });
        },

        _cancel: function() {

            this.application.navigateTo("campaigns");
        },

        _onPhaseAdded: function(event) {

            var index = event.index;
            var $phases = this.$(".js-phases");
            if (index === 0) {
                $phases.empty();
            }
            _.each(event.elements, function(phase, i) {
                var phaseView = new PhaseView(this, {
                    campaign: this.campaign,
                    phase: phase,
                    index: index + i
                });
                $phases.append(phaseView.render());
            }, this);
        },

        _onPhaseRemoved: function() {

            this.$(".js-phases").empty();
            this._renderPhases();
        },

        _removePhase: function(event) {

            var index = this.targetData(event, "phase-index");
            this.campaign.phases.splice(index, 1);
        },

        _renderPhases: function() {

            var $phases = this.$(".js-phases");
            if (this.campaign.phases.length > 0) {
                _.each(this.campaign.phases, function(phase, index) {
                    var phaseView = new PhaseView(this, {
                        campaign: this.campaign,
                        phase: phase,
                        index: index
                    });
                    $phases.append(phaseView.render());
                }, this);
            } else {
                $phases.html(tmpl.nophases());
            }
        },

        _save: function() {

            var $button = this.$(".action-save");
            $button.addClass("btn-progress");

            this.scheduleOptions.save();

            this.campaign.save({ context: this }).then(function() {
                this.application.navigation.goBack();
            }, function(error) {
                this.showError(i18n("Could not save the campaign"), error);
            }).always(function() {
                $button.removeClass("btn-progress");
            });
        },

        _toggleAdvanced: function() {

            this.campaign.advancedOptionsExpanded = !this.campaign.advancedOptionsExpanded;
        }

    });

});
