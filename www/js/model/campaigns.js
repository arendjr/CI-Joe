define("model/campaigns", ["collection", "model/campaign"], function(Collection, CampaignModel) {

    "use strict";

    return Collection.extend({

        ModelClass: CampaignModel,

        type: "campaigns"

    });

});
