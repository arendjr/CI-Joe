define("modelfactory",
       ["model/campaign", "model/campaigns", "model/mission", "model/missions", "model/slave",
        "model/slaves", "lodash"],
       function(CampaignModel, CampaignsModel, MissionModel, MissionsModel, SlaveModel,
                SlavesModel, _) {

    "use strict";

    /**
     * Model Factory.
     *
     * Used for instantiating models by type.
     *
     * @param application Reference to the application object.
     */
    function ModelFactory(application) {

        /**
         * Reference to the application object.
         */
        this.application = application;
    }

    _.extend(ModelFactory.prototype, {

        /**
         * Creates a new Model instance.
         *
         * @param type Type of the model to create.
         * @param attributes Optional map of attributes to assign to the model.
         */
        create: function(type, attributes) {

            var application = this.application;

            switch (type) {
            case "campaign":
                return new CampaignModel(application, attributes);
            case "campaigns":
                return new CampaignsModel(application, attributes);
            case "mission":
                return new MissionModel(application, attributes);
            case "missions":
                return new MissionsModel(application, attributes);
            case "slave":
                return new SlaveModel(application, attributes);
            case "slaves":
                return new SlavesModel(application, attributes);
            default:
                throw new Error("Unknown model type: " + type);
            }
        }

    });

    return ModelFactory;

});
