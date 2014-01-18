"use strict";


var _ = require("lodash");


var Errors = {
    success:            { httpStatus: 200, errorCode: 0, errorMessage: "Success" },
    invalidRequest:     { httpStatus: 400, errorCode: -1, errorMessage: "Invalid Request" },
    invalidCredentials: { httpStatus: 400, errorCode: -2, errorMessage: "Invalid Credentials" },
    invalidToken:       { httpStatus: 403, errorCode: -3, errorMessage: "Invalid Token" },
    invalidData:        { httpStatus: 400, errorCode: -4, errorMessage: "Invalid Data" },
    notFound:           { httpStatus: 404, errorCode: -5, errorMessage: "Not Found" },
    serverError:        { httpStatus: 500, errorCode: -6, errorMessage: "Internal Server Error" },
    alreadyStarted:     { httpStatus: 400, errorCode: -7, errorMessage: "Already Started" },
    unknownCampaign:    { httpStatus: 404, errorCode: -8, errorMessage: "Unknown Campaign" }
};


module.exports = _.object(_.keys(Errors), _.map(Errors, function(error) {
    return function(description) {
        return _.extend(new Error(description), error);
    };
}));
