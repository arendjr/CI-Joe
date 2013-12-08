define("view/mission",
       ["laces.tie", "view", "tmpl/mission"],
       function(Laces, View, tmpl) {

    "use strict";

    return View.extend({

        initialize: function(options) {

            this.mission = options.mission;
        },

        render: function() {

            var tie = new Laces.Tie(this.mission, tmpl.mission);
            return this.$el.html(tie.render());
        }

    });

});
