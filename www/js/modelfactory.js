define("modelfactory",
       ["model/mission", "model/missions", "lodash"],
       function(MissionModel, MissionsModel, _) {

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
            case "mission":
                return new MissionModel(application, attributes);
            case "missions":
                return new MissionsModel(application, attributes);
            default:
                throw new Error("Unknown model type: " + type);
            }
        }

    });

    return ModelFactory;

});
