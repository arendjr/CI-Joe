define("page/settings", ["page", "view/settings"], function(Page, SettingsView) {

    "use strict";

    return Page.extend({

        public: true,

        createRootView: function() {

            return new SettingsView(this);
        },

        section: "settings"

    });

});
