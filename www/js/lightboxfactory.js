define("lightboxfactory",
       ["lightbox/confirm", "lightbox/editmission", "lodash"],
       function(ConfirmLightbox, EditMissionLightbox, _) {

    "use strict";

    var LIGHTBOX_MAP = {
        Confirm: ConfirmLightbox,
        EditMission: EditMissionLightbox
    };

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
         * @param options Optional options object to pass to the lightbox.
         */
        create: function(type, options) {

            if (_.has(LIGHTBOX_MAP, type)) {
                return new LIGHTBOX_MAP[type](this.application, options);
            } else {
                console.log("Unknown lightbox type: " + type);
                return null;
            }
        }

    });

    return LightboxFactory;

});
