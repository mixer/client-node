var Bluebird = require('bluebird');
var errors = require('../../lib/errors');
var sinon = require('sinon');
var expect =  require('chai').expect;

describe('providers', function () {
    describe('password', function () {
        var Provider = require('../../lib/providers/password');
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

    describe('oauth', function () {
        var Provider = require('../../lib/providers/oauth');
        var provider;
        var redir = 'http://localhost';

        beforeEach(function () {
            provider = new Provider(this.client, 'eye-dee', 'seekrit');
            sinon.stub(this.client, 'request');
            this.clock = sinon.useFakeTimers();
        });

        afterEach(function () {
            this.clock.restore();
        })

        it('has a correct initial state', function () {
            expect(provider.isAuthenticated()).to.be.false;
            expect(provider.accessToken()).to.be.undefined;
            expect(provider.refreshToken()).to.be.undefined;
            expect(provider.expires()).to.be.undefined;
            expect(provider.getRequest()).to.deep.equal({});
        });

        it('generates an authorization url', function () {
            expect(provider.getRedirect(redir, ['foo', 'bar']))
                .to.equal('https://beam.pro/api/v1/oauth/authorize?redirect_uri=' +
                          'http%3A%2F%2Flocalhost&response_type=code&scope=foo%2Cbar' +
                          '&client_id=eye-dee&client_secret=seekrit');
        });

        it('denies when error in query string', function (done) {
            provider.attempt(redir, { error: 'invalid_grant' })
                .bind(this)
                .catch(errors.AuthenticationFailedError, function (e) {
                    expect(this.client.request.called).to.be.false;
                    done();
                });
        });

        it('denies when no code in query string', function (done) {
            provider.attempt(redir, { error: 'invalid_grant' })
                .bind(this)
                .catch(errors.AuthenticationFailedError, function (e) {
                    expect(this.client.request.called).to.be.false;
                    done();
                });
        });

        it('denies when error from API', function (done) {
            this.client.request.returns(Bluebird.resolve({
                statusCode: 400,
                body: { error: 'invalid_grant'}
            }));

            provider.attempt(redir, { code: 'asdf' })
                .bind(this)
                .catch(errors.AuthenticationFailedError, function (e) {
                    sinon.assert.calledWith(this.client.request, 'post', '/oauth/token', {
                        form: {
                            grant_type: 'authorization_code',
                            code: 'asdf',
                            redirect_uri: redir,
                            client_id: 'eye-dee',
                            client_secret: 'seekrit'
                        }
                    });
                    done();
                });
        });

        it('allows when all good', function (done) {
            this.client.request.returns(Bluebird.resolve({
                statusCode: 200,
                body: { access_token: 'access', refresh_token: 'refresh', expires_in: 60 * 60 }
            }));

            provider.attempt(redir, { code: 'asdf' }).then(function () {
                expect(provider.isAuthenticated()).to.be.true;
                expect(provider.accessToken()).to.equal('access');
                expect(provider.refreshToken()).to.equal('refresh');
                expect(+provider.expires()).to.equal(60 * 60 * 1000);
                expect(provider.getRequest()).to.deep.equal({
                    headers: { Authorization: 'Bearer access' }
                });
                done();
            }).catch(done);
        });

        it('expires after a time', function () {
            provider.tokens = { access: 'access', refresh: 'refresh', expires: new Date(Date.now() + 10) };
            expect(provider.isAuthenticated()).to.be.true;
            this.clock.tick(11);
            expect(provider.isAuthenticated()).to.be.false;
        });

        it('restores from tokens', function () {
            provider = new Provider(this.client, 'eye-dee', 'seekrit', {
                access: 'access',
                refresh: 'refresh',
                expires: new Date(Date.now() + 10)
            });
            expect(provider.isAuthenticated()).to.be.true;

            // without secret
            provider = new Provider(this.client, 'eye-dee', {
                access: 'access',
                refresh: 'refresh',
                expires: new Date(Date.now() + 10)
            });
            expect(provider.isAuthenticated()).to.be.true;
        });

        it('refreshes correctly', function (done) {
            this.client.request.returns(Bluebird.resolve({
                statusCode: 200,
                body: { access_token: 'access', refresh_token: 'refresh', expires_in: 60 * 60 }
            }));

            provider.tokens = { access: 'old', refresh: 'oldRefresh', expires: new Date() };

            provider.refresh().then(function () {
                sinon.assert.calledWith(this.client.request, 'post', '/oauth/token', {
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: 'oldRefresh',
                        client_id: 'eye-dee',
                        client_secret: 'seekrit'
                    }
                });

                expect(provider.isAuthenticated()).to.be.true;
                expect(provider.accessToken()).to.equal('access');
                expect(provider.refreshToken()).to.equal('refresh');
                expect(+provider.expires()).to.equal(60 * 60 * 1000);
                done();
            }).catch(done);
        });
    });
});
