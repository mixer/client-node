var expect = require('chai').expect;
var errors = require('../../src/errors');

describe('services', () =>{
    var Service = require('../../src/services/Service');
    var service;

    beforeEach(() => {
        service = new Service();
    });

    it('handles a successful response', () => {
        var res = { statusCode: 200, body: 'foo' };
        expect(service.handleResponse(res, {})).to.deep.equal({ statusCode: 200, body: 'foo' });
    });

    it('handles a response given a handler', () => {
        var res = { statusCode: 401, body: '"foo"' };
        expect(() => {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError,
            });
        }).to.throw(errors.NotAuthenticatedError);
    });

    it('handles a response that has no handler', () => {
        var res = { statusCode: 500, body: '"foo"' };
        expect(() => {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError,
            });
        }).to.throw(errors.UnknownCodeError);
    });
});
