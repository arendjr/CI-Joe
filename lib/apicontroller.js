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

        function handleError(req, res, error) {
            if (error.stack) {
                console.log("Exception while handling " + req.url + ": ");
                console.log(error.stack);
                error = Errors.serverError();
            }

            res.status(error.httpStatus);
            delete error.httpStatus;
            res.send(error);
        }

        var self = this;

        app.get("/api/missions/", function(req, res) {
            res.send({
                items: _.map(self.commandPost.missions, function(mission) {
                    return mission.toJSON();
                }),
                numItems: self.commandPost.missions.length
            });
        });

        app.post("/api/missions/", function(req, res) {
            try {
                var id = self.commandPost.addMission(req.body);
                res.send({ id: id });
            } catch(exception) {
                handleError(req, res, exception);
            }
        });
    }

});


module.exports = ApiController;
