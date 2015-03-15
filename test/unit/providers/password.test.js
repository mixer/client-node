var Bluebird = require('bluebird');
var errors = require('../../../lib/errors');
var sinon = require('sinon');
var expect =  require('chai').expect;

describe('password provider', function () {
    var Provider = require('../../../lib/providers/password');
    var provider;

    beforeEach(function () {
        provider = new Provider('foo', 'bar', 42);
    });

    it('successfully attempts', function (done) {
        var body = JSON.stringify({ username: 'connor4312' });
        var stub = sinon.stub(this.client, 'request').returns(Bluebird.resolve({ statusCode: 200, body: body }));
        var client = this.client;
        this.client.auth(provider).then(function () {
            expect(stub.calledWith('post', '/users/login', { username: 'foo', password: 'bar', code: 42 }));
            expect(this.getUser()).to.deep.equal({ username: 'connor4312' });
            done();
        });
    });

    it('fails attempts', function (done) {
        var stub = sinon.stub(this.client, 'request').returns(Bluebird.resolve({ statusCode: 401 }));
        this.client.auth(provider).catch(function (err) {
            expect(err).to.be.an.instanceOf(errors.AuthenticationFailedError);
            expect(this.getUser()).to.be.null;
            done();
        });
    });

    it('uses the cookie jar in requests. mm, cookies', function () {
        expect(provider.getRequest().jar).to.be.a('object');
    });
});
