define("page/dashboard", ["page", "view/dashboard"], function(Page, DashboardView) {

    "use strict";

    return Page.extend({

        public: true,

        getRootView: function() {

            return new DashboardView(this);
        }

    });

});
