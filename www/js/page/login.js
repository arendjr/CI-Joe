define("page/login", ["page", "view/login"], function(Page, LoginView) {

    "use strict";

    return Page.extend({

        public: true,

        createRootView: function() {

            return new LoginView(this);
        }

    });

});
