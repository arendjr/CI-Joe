define("page/newcampaign",
       ["i18n", "page", "view/editcampaign"],
       function(i18n, Page, EditCampaignView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            return new EditCampaignView(this.application, {
                campaign: {
                    phases: [{
                        continueAfterFailure: false,
                        missions: []
                    }],
                    workspaces: [{
                        name: i18n("Unnamed workspace").toString()
                    }]
                }
            });
        },

        section: "campaigns"

    });

});
