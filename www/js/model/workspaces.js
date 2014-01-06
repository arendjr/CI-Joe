define("model/workspaces", ["collection", "model/workspace"], function(Collection, WorkspaceModel) {

    "use strict";

    return Collection.extend({

        ModelClass: WorkspaceModel,

        type: "workspaces"

    });

});
