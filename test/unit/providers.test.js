const errors = require('../../src/errors');
const sinon = require('sinon');
const { expect } = require('chai');

describe('providers', function () {
    describe('password', function () {
        const { PasswordProvider } = require('../../src/providers/password');
        let provider;
        const csrfToken = 'abc123';
        const body = JSON.stringify({ username: 'connor4312' });
        const okResponse = {
            statusCode: 200,
            body: body,
            headers: {},
        };
        okResponse.headers[PasswordProvider.CSRF_TOKEN_LOCATION] = csrfToken;

        const invalidCSRFResponse = {
            statusCode: PasswordProvider.INVALID_CSRF_CODE,
            headers: {},
            body: {
                error: 'Invalid or missing CSRF header, see details here: <https://dev.beam.pro/rest.html#csrf>',
                statusCode: PasswordProvider.INVALID_CSRF_CODE,
            },
        };
        invalidCSRFResponse.headers[PasswordProvider.CSRF_TOKEN_LOCATION] = 'new token';


        beforeEach(function () {
            provider = new PasswordProvider(this.client, {
                username: 'foo',
                password: 'bar',
                code: 42,
            });
        });

        it('successfully attempts', function () {
            const stub = sinon.stub(this.client, 'request')
            .resolves(okResponse);

            return provider.attempt()
            .then(() =>{
                expect(stub.calledWith('post', '/users/login', {
                    username: 'foo',
                    password: 'bar',
                    code: 42,
                }));
                expect(provider.csrfToken).to.equal(csrfToken);
            });
        });

        it('fails attempts', () =>{
            return provider.attempt()
            .catch(err => {
                expect(err).to.be.an.instanceOf(errors.AuthenticationFailedError);
            });
        });

        it('uses the cookie jar in requests. mm, cookies', () =>{
            expect(provider.getRequest().jar).to.be.a('object');
        });

        it('includes the csrf token in requests. mm, tokens', () =>{
            expect(provider.getRequest().headers).to.include.keys(PasswordProvider.CSRF_TOKEN_LOCATION);
        });

        it('updates a csrf token on a 461 response code and then retries the request', function () {
            this.client.provider = provider;
            this.request.run = req => {
                if (req.headers[PasswordProvider.CSRF_TOKEN_LOCATION] !== 'new token') {
                    return Promise.reject(invalidCSRFResponse);
                } else {
                    return Promise.resolve(okResponse);
                }
            };
            return this.client.request('get', '/users/current').then(res => {
                expect(res.statusCode).to.equal(200);
                expect(provider.csrfToken).to.equal('new token');
            });
        });
    });

    describe('oauth', function () {
        const { OAuthProvider } = require('../../src/providers/oauth');
        let provider;
        const redir = 'http://localhost';

        beforeEach(function () {
            provider = new OAuthProvider(this.client, {
                clientId: 'eye-dee',
                secret: 'seekrit',
            });
            sinon.stub(this.client, 'request');
            this.clock = sinon.useFakeTimers();
        });

        afterEach(function () {
            this.clock.restore();
        });

        it('has a correct initial state', function () {
            expect(provider.isAuthenticated()).to.be.false;
            expect(provider.accessToken()).to.be.undefined;
            expect(provider.refreshToken()).to.be.undefined;
            expect(provider.expires()).to.be.undefined;
            expect(provider.getRequest()).to.deep.equal({});
        });

        it('generates an authorization url', function () {
            expect(provider.getRedirect(redir, ['foo', 'bar']))
            .to.equal('https://beam.pro/oauth/authorize?redirect_uri=' +
                          'http%3A%2F%2Flocalhost&response_type=code&scope=foo%20bar' +
                          '&client_id=eye-dee');
        });

        it('denies when error in query string', function () {
            return provider.attempt(redir, { error: 'invalid_grant' })
            .catch(err => {
                expect(err).to.be.instanceof(errors.AuthenticationFailedError);
                expect(this.client.request.called).to.be.false;
            });
        });

        it('denies when no code in query string', function () {
            return provider.attempt(redir, { error: 'invalid_grant' })
            .catch(err => {
                expect(err).to.be.instanceof(errors.AuthenticationFailedError);
                expect(this.client.request.called).to.be.false;
            });
        });

        it('denies when error from API', function() {
            this.client.request.resolves({
                statusCode: 400,
                body: { error: 'invalid_grant' },
            });

            return provider.attempt(redir, { code: 'asdf' })
            .catch(err => {
                expect(err).to.be.instanceof(errors.AuthenticationFailedError);
                sinon.assert.calledWith(this.client.request, 'post', '/oauth/token', {
                    form: {
                        grant_type: 'authorization_code',
                        code: 'asdf',
                        redirect_uri: redir,
                        client_id: 'eye-dee',
                        client_secret: 'seekrit',
                    },
                });
            });
        });

        it('allows when all good', function() {
            this.client.request.resolves({
                statusCode: 200,
                body: { access_token: 'access', refresh_token: 'refresh', expires_in: 60 * 60 },
            });

            return provider.attempt(redir, { code: 'asdf' }).then(() =>{
                expect(provider.isAuthenticated()).to.be.true;
                expect(provider.accessToken()).to.equal('access');
                expect(provider.refreshToken()).to.equal('refresh');
                expect(+provider.expires()).to.equal(60 * 60 * 1000);
                expect(provider.getRequest()).to.deep.equal({
                    headers: { Authorization: 'Bearer access' },
                });
            });
        });

        it('expires after a time', function() {
            provider.tokens = {
                access: 'access',
                refresh: 'refresh',
                expires: new Date(Date.now() + 10),
            };
            expect(provider.isAuthenticated()).to.be.true;
            this.clock.tick(11);
            expect(provider.isAuthenticated()).to.be.false;
        });

        it('restores from tokens', function() {
            provider = new OAuthProvider(this.client, {
                clientId: 'eye-dee',
                tokens: {
                    access: 'access',
                    refresh: 'refresh',
                    expires: new Date(Date.now() + 10),
                },
            });
            expect(provider.isAuthenticated()).to.be.true;
        });

        it('refreshes correctly', function() {
            this.client.request.resolves({
                statusCode: 200,
                body: { access_token: 'access', refresh_token: 'refresh', expires_in: 60 * 60 },
            });

            provider.tokens = { access: 'old', refresh: 'oldRefresh', expires: new Date() };

            return provider.refresh()
            .then(() =>{
                sinon.assert.calledWith(this.client.request, 'post', '/oauth/token', {
                    form: {
                        grant_type: 'refresh_token',
                        refresh_token: 'oldRefresh',
                        client_id: 'eye-dee',
                        client_secret: 'seekrit',
                    },
                });

                expect(provider.isAuthenticated()).to.be.true;
                expect(provider.accessToken()).to.equal('access');
                expect(provider.refreshToken()).to.equal('refresh');
                expect(+provider.expires()).to.equal(60 * 60 * 1000);
            });
        });
    });
});
