define("page/mainoverview", ["page", "view/mainoverview"], function(Page, MainOverviewView) {

    "use strict";

    return Page.extend({

        createRootView: function() {

            return new MainOverviewView(this);
        }

    });

});
