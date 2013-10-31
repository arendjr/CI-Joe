define("model/missions", ["collection", "model/mission"], function(Collection, MissionModel) {

    "use strict";

    return Collection.extend({

        ModelClass: MissionModel,

        type: "missions"

    });

});
