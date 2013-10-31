define("view/mainoverview",
       ["view", "view/missionsoverview"],
       function(View, MissionsOverviewView) {

    "use strict";

    return View.extend({

        render: function() {

            this.removeChildren();

            var overview = new MissionsOverviewView(this, { missions: this.options.missions });
            this.$el.html(overview.render());

            return this.$el;
        }

    });

});
