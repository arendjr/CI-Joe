define("page/mainoverview", ["page", "view/mainoverview"], function(Page, MainOverviewView) {

    "use strict";

    return Page.extend({

        getRootView: function() {

            return new MainOverviewView(this);
        }

    });

});
