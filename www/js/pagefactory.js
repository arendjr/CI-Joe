define("pagefactory",
       ["lodash", "page/campaignsoverview", "page/editcampaign", "page/error", "page/headquarters",
        "page/login", "page/mission", "page/missionsoverview", "page/newcampaign"],
       function(_, CampaignsOverviewPage, EditCampaignPage, ErrorPage, HeadquartersPage,
                LoginPage, MissionPage, MissionsOverviewPage, NewCampaignPage) {

    "use strict";

    var PAGE_MAP = {
        CampaignsOverview: CampaignsOverviewPage,
        EditCampaign: EditCampaignPage,
        Error: ErrorPage,
        Headquarters: HeadquartersPage,
        Login: LoginPage,
        Mission: MissionPage,
        MissionsOverview: MissionsOverviewPage,
        NewCampaign: NewCampaignPage
    };

    /**
     * Page Factory.
     *
     * Used for instantiating new pages by type.
     *
     * @param application Reference to the application object.
     */
    function PageFactory(application) {

        /**
         * Reference to the application object.
         */
        this.application = application;
    }

    _.extend(PageFactory.prototype, {

        /**
         * Creates a new page instance.
         *
         * @param type Type of the page to instantiate.
         * @param id EID of the page to open (optional).
         * @return A Page object.
         */
        create: function(type, id) {

            if (_.has(PAGE_MAP, type)) {
                return new PAGE_MAP[type](this.application, type, id);
            } else {
                console.log("Unknown page type: " + type);
                return null;
            }
        },

        /**
         * Returns whether pages of a specific type are public.
         *
         * @param type Page type to check.
         * @return boolean, or undefined in case of an unknown type.
         */
        isPublic: function(type) {

            if (_.has(PAGE_MAP, type)) {
                return PAGE_MAP[type].prototype.public;
            } else {
                return undefined;
            }
        }

    });

    return PageFactory;

});
