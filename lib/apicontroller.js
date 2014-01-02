"use strict";


var _ = require("lodash");
var Errors = require("./errors");


/**
 * API Controller.
 *
 * Handles API requests from clients.
 */
function ApiController(commandPost, slaveDriver) {

    /**
     * Command Post instance.
     */
    this.commandPost = commandPost;

    /**
     * Slave Driver instance.
     */
    this.slaveDriver = slaveDriver;
}

_.extend(ApiController.prototype, {

    attachTo: function(app) {

        function handleError(req, res, error) {
            if (error.stack) {
                console.log("Exception while handling " + req.url + ":");
                console.log(error.stack);
                error = Errors.serverError();
            }

            res.status(error.httpStatus);
            delete error.httpStatus;
            res.send(error);
        }

        var self = this;

        app["delete"]("/api/missions/:id/", function(req, res) {
            try {
                var id = req.params.id;
                if (self.commandPost.removeMission(id)) {
                    res.send({});
                } else {
                    throw Errors.notFound();
                }
            } catch(exception) {
                handleError(req, res, exception);
            }
        });

        app.get("/api/missions/", function(req, res) {
            res.send({
                items: _.map(self.commandPost.missions, function(mission) {
                    return mission.toJSON();
                }),
                numItems: self.commandPost.missions.length
            });
        });

        app.get("/api/missions/:missionId/jobs/:jobId/action-results/", function(req, res) {
            try {
                var missionId = req.params.missionId;
                var mission = self.commandPost.getMission(missionId);
                if (!mission) {
                    throw Errors.notFound();
                }

                var jobId = req.params.jobId;
                var job = mission.getJob(jobId);
                if (!job) {
                    throw Errors.notFound();
                }

                job.loadActionResults();
                res.send({
                    actionResults: job.actionResults,
                    jobId: jobId
                });
            } catch(exception) {
                handleError(req, res, exception);
            }
        });

        app.get("/api/slaves/", function(req, res) {
            res.send({
                items: _.map(self.slaveDriver.slaves, function(slave) {
                    return slave.toJSON();
                }),
                numItems: self.slaveDriver.slaves.length
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

        app.post("/api/missions/:id/start", function(req, res) {
            try {
                var missionId = req.params.id;
                self.commandPost.startJob(missionId);
                res.send({});
            } catch(exception) {
                handleError(req, res, exception);
            }
        });

        app.put("/api/missions/:id/", function(req, res) {
            try {
                if (self.commandPost.updateMission(req.body)) {
                    res.send({});
                } else {
                    throw Errors.notFound();
                }
            } catch(exception) {
                handleError(req, res, exception);
            }
        });
    }

});


module.exports = ApiController;
