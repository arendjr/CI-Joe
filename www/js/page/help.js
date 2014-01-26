define("page/help", ["page", "view/help"], function(Page, HelpView) {

    "use strict";

    return Page.extend({

        public: true,

        createRootView: function() {

            return new HelpView(this);
        },

        section: "help"

    });

});
