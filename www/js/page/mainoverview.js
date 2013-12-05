define("page/mainoverview", ["page", "view/missionsoverview"], function(Page, MissionsOverviewView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            return new MissionsOverviewView(this.application, {
                missions: this.application.missions
            });
        }

    });

});
