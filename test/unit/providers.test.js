const sinon = require('sinon');
const { expect } = require('chai');

const CLIENT_ID = 'eye-dee';

describe('providers', function () {
    const { AuthenticationFailedError } = require('@mixer/chat-client-websocket');
    const { OAuthProvider } = require('../../src');

    describe('oauth', function () {
        let provider;
        const redir = 'http://localhost';

        beforeEach(function () {
            provider = new OAuthProvider(this.client, {
                clientId: CLIENT_ID,
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
            expect(provider.getRequest()).to.deep.equal({
                headers: {
                    'Client-ID': CLIENT_ID,
                },
            });
        });

        it('generates an authorization url', function () {
            expect(provider.getRedirect(redir, ['foo', 'bar']))
            .to.equal('https://mixer.com/oauth/authorize?redirect_uri=' +
                          'http%3A%2F%2Flocalhost&response_type=code&scope=foo%20bar' +
                          `&client_id=${CLIENT_ID}`);
        });

        it('denies when error in query string', function () {
            return provider.attempt(redir, { error: 'invalid_grant' })
            .catch(err => {
                expect(err).to.be.instanceof(AuthenticationFailedError);
                expect(this.client.request.called).to.be.false;
            });
        });

        it('denies when no code in query string', function () {
            return provider.attempt(redir, { error: 'invalid_grant' })
            .catch(err => {
                expect(err).to.be.instanceof(AuthenticationFailedError);
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
                expect(err).to.be.instanceof(AuthenticationFailedError);
                sinon.assert.calledWith(this.client.request, 'post', '/oauth/token', {
                    form: {
                        grant_type: 'authorization_code',
                        code: 'asdf',
                        redirect_uri: redir,
                        client_id: CLIENT_ID,
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
                    headers: {
                        Authorization: 'Bearer access',
                        'Client-ID': CLIENT_ID,
                    },
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
                clientId: CLIENT_ID,
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
                        client_id: CLIENT_ID,
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
