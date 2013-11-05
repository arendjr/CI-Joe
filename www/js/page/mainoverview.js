define("page/mainoverview", ["page", "view/mainoverview"], function(Page, MainOverviewView) {

    "use strict";

    return Page.extend({

        beforeShow: function() {

            this.application.missions.fetch();
        },

        createRootView: function() {

            return new MainOverviewView(this.application, { missions: this.application.missions });
        }

    });

});
