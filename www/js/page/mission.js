define("page/mission", ["page", "view/mission"], function(Page, MissionView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            return new MissionView(this.application, {
                mission: this.application.missions.get(this.id)
            });
        }

    });

});
