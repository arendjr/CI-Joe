"use strict";


var _ = require("lodash");


var Errors = {
    success:        { httpStatus: 200, errorCode: 0, errorMessage: "Success" },
    invalidRequest: { httpStatus: 400, errorCode: 1, errorMessage: "Invalid Request" },
    invalidToken:   { httpStatus: 403, errorCode: 2, errorMessage: "Invalid Token" },
    invalidData:    { httpStatus: 400, errorCode: 3, errorMessage: "Invalid Data" },
    notFound:       { httpStatus: 404, errorCode: 4, errorMessage: "Not Found" },
    serverError:    { httpStatus: 500, errorCode: 5, errorMessage: "Server Error" }
};


module.exports = _.object(_.keys(Errors), _.map(Errors, function(error) {
    return function(description) {
        return (description ? _.extend({}, error, { description: description }) : _.clone(error));
    };
}));
