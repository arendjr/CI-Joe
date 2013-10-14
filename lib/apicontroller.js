"use strict";


var _ = require("lodash");
var Errors = require("./errors");


/**
 * API Controller.
 *
 * Keeps track of all missions, and dispatches them to slaves.
 */
function ApiController(commandPost) {

    /**
     * Command Post instance.
     */
    this.commandPost = commandPost;
}

_.extend(ApiController.prototype, {

    attachTo: function(app) {

        function handleError(res, error) {
            res.statusCode = error.httpStatus;
            delete error.httpStatus;
            res.end(error);
        }

        var self = this;

        app.get("/api/missions/", function(req, res) {
            res.send(_.map(self.commandPost.missions, function(mission) {
                return mission.toJSON();
            }));
        });

        app.post("/api/missions/", function(req, res) {
            try {
                self.commandPost.addMission(req.body);
                res.send(Errors.success());
            } catch(exception) {
                handleError(res, exception);
            }
        });
    }

});


module.exports = ApiController;
