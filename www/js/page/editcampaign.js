define("page/editcampaign",
       ["page", "status", "view/editcampaign", "view/error"],
       function(Page, Status, EditCampaignView, ErrorView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            var campaign = this.application.campaigns.get(this.id);
            if (campaign) {
                return new EditCampaignView(this.application, {
                    campaign: campaign.toJSON()
                });
            } else {
                return new ErrorView(this.application, { error: Status.Replies.UNKNOWN_CAMPAIGN });
            }
        },

        section: "campaigns"

    });

});
