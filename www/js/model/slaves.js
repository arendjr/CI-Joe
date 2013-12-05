define("model/slaves", ["collection", "model/slave"], function(Collection, SlaveModel) {

    "use strict";

    return Collection.extend({

        ModelClass: SlaveModel,

        type: "slaves"

    });

});
