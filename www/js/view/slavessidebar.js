define("view/slavessidebar",
       ["continuouspager", "tmpl/slavessidebar", "tmpl/slavessidebaritem"],
       function(ContinuousPager, tmpl) {

    "use strict";

    return ContinuousPager.extend({

        initialize: function(options) {

            this.collection = options.slaves;

            this.itemTemplate = tmpl.slavessidebaritem;

            this.template = tmpl.slavessidebar;
        }

    });

});
