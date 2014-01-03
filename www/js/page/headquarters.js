define("page/headquarters", ["page", "view/headquarters"], function(Page, HeadquartersView) {

    "use strict";

    return Page.extend({

        public: true,

        createRootView: function() {

            return new HeadquartersView(this);
        },

        section: "headquarters"

    });

});
