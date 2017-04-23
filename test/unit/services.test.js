const expect = require('chai').expect;
const errors = require('../../src/errors');

describe('services', () =>{
    const { Service } = require('../../src/services/Service');
    let service;

    beforeEach(() => {
        service = new Service();
    });

    it('handles a successful response', () => {
        const res = { statusCode: 200, body: 'foo' };
        expect(service.handleResponse(res, {})).to.deep.equal({ statusCode: 200, body: 'foo' });
    });

    it('handles a response given a handler', () => {
        const res = { statusCode: 401, body: '"foo"' };
        expect(() => {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError,
            });
        }).to.throw(errors.NotAuthenticatedError);
    });

    it('handles a response that has no handler', () => {
        const res = { statusCode: 500, body: '"foo"' };
        expect(() => {
            service.handleResponse(res, {
                401: errors.NotAuthenticatedError,
            });
        }).to.throw(errors.UnknownCodeError);
    });
});
