define("lightboxfactory", ["underscore"], function(_) {

    "use strict";

    /**
     * Lightbox Factory.
     *
     * Used for instantiating new lightboxes by type.
     *
     * @param application Reference to the application object.
     */
    function LightboxFactory(application) {

        /**
         * Reference to the application object.
         */
        this.application = application;
    }

    _.extend(LightboxFactory.prototype, {

        /**
         * Creates a new lightbox instance.
         *
         * @param type Type of the lightbox to instantiate.
         * @param parent Optional parent of the lightbox. By default, the application object is
         *               used as parent.
         */
        create: function(type, parent) {

            parent = parent || this.application;

            switch (type) {
            default:
                console.log("Unknown lightbox type: " + type);
                return null;
            }
        }

    });

    return LightboxFactory;

});
