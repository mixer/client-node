const expect = require('chai').expect;

describe('services', () =>{
    const { Service, NotAuthenticatedError, UnknownCodeError } = require('../../src');
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
                401: NotAuthenticatedError,
            });
        }).to.throw(NotAuthenticatedError);
    });

    it('handles a response that has no handler', () => {
        const res = { statusCode: 500, body: '"foo"' };
        expect(() => {
            service.handleResponse(res, {
                401: NotAuthenticatedError,
            });
        }).to.throw(UnknownCodeError);
    });
});
