"use strict";

const expect = require("chai").expect;
const errors = require("../../js/lib/errors");

describe("services", function () {
    var Service = require("../../js/lib/services/service");
    var service;

    beforeEach(function () {
        service = new Service();
    });

    it("handles a successful response", function () {
        var res = { statusCode: 200, body: "foo" };
        expect(service.handleResponse(res, {})).to.deep.equal({ statusCode: 200, body: "foo" });
    });

    it("handles a response given a handler", function () {
        var res = { statusCode: 401, body: "foo" };
        expect(function () {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError
            });
        }).to.throw(errors.NotAuthenticatedError);
    });

    it("handles a response that has no handler", function () {
        var res = { statusCode: 500, body: "foo" };
        expect(function () {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError
            });
        }).to.throw(errors.UnknownCodeError);
    });
});