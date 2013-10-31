define("lightbox/editmission",
       ["i18n", "laces", "lightbox", "tmpl/editmission"],
       function(i18n, Laces, Lightbox, tmpl) {

    "use strict";

    return Lightbox.extend({

        initialize: function(options) {

            var mission = options.mission;

            this.title = (mission ? i18n("Edit %1").arg(mission.name) : i18n("New Mission"));

            this.mission = mission;
        },

        events: {
            "click .action-save": "_save"
        },

        renderContent: function() {

            var tie = new Laces.Tie(this.mission, tmpl.editmission);
            this.$(".js-content").html(tie.render());
        },

        _save: function() {

            alert(this.mission.name);
            return false;
        }

    });

});
