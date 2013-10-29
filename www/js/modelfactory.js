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
         * @param id Optional ID of the model to create.
         */
        create: function(type, id) {

            var application = this.application;
            var attributes = {};

            if (id) {
                attributes.id = id;
            }

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
