var expect = require('chai').expect;
var errors = require('../../lib/errors');

describe('services', function () {
    var Service = require('../../lib/services/service');
    var service;

    beforeEach(function () {
        service = new Service();
    });

    it('extracts the body when successful', function () {
        var res = { body: '"foo"'};
        service.extractBody(res);
        expect(res).to.deep.equal({ body: 'foo' });
    });

    it('extracts the body when invalid', function () {
        var res = { body: '<html>'};
        service.extractBody(res);
        expect(res).to.deep.equal({ body: '<html>', statusCode: 404 });
    });

    it('handles a successful response', function () {
        var res = { statusCode: 200, body: '"foo"' };
        expect(service.handleResponse(res, {})).to.deep.equal({ statusCode: 200, body: 'foo' });
    });

    it('handles a response given a handler', function () {
        var res = { statusCode: 401, body: '"foo"' };
        expect(function () {
            service.handleResponse(res, {
                '401': errors.NotAuthenticatedError
            });
        }).to.throw(errors.NotAuthenticatedError);
    });

    it('handles a response that has no handler', function () {
        var res = { statusCode: 500, body: '"foo"' };
        expect(function () {
            service.handleResponse(res, {
                '401': errors.NotAuthenticatedError
            });
        }).to.throw(errors.UnknownCodeError);
    });
});
