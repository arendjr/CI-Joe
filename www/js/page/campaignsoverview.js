define("page/campaignsoverview",
       ["page", "view/campaignsoverview"],
       function(Page, CampaignsOverviewView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            return new CampaignsOverviewView(this.application, {
                campaigns: this.application.campaigns
            });
        },

        section: "campaigns"

    });

});
