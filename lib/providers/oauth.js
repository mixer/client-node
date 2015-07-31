var Bluebird = require('bluebird');
var Base = require('./base');

var errors = require('../errors');
var _ = require('lodash');

/**
 * Provider for password-based authentication.
 *
 * @access public
 * @augments BaseProvider
 * @param {Client} client The associated Node client.
 * @param {String} clientId Your application client ID.
 * @param {String} [secret] Your secret token, if enabled.
 * @param {Object} [tokens] A stored set of tokens to reused for
 *                          authentication.
 */
function OAuthProvider (client, clientId, secret, tokens) {
    Base.call(this);

    if (secret && typeof secret === 'object') {
        tokens = secret;
        secret = undefined;
    }

    this.details = { client_id: clientId, client_secret: secret };
    this.client = client;
    this.tokens = tokens || {};
}

OAuthProvider.prototype = new Base();

/**
 * Returns if the client is currently authenticated: they must
 * have a non-expired key pair.
 * @return {Boolean}
 */
OAuthProvider.prototype.isAuthenticated = function () {
    return this.tokens.access !== undefined && this.tokens.expires > Date.now();
};

/**
 * Returns a redirect to the webpage to get authentication.
 * @param {String} redirect Redirect URI to return to after auth.
 *     In this URL, you should run `.attempt(req.query)`.
 * @param {String[]|String} permissions A list of permissions you'd
 *     like to request.
 * @return {String}
 */
OAuthProvider.prototype.getRedirect = function (redirect, permissions) {
    return this.client.buildAddress('/oauth/authorize', _.extend({
        redirect_uri: redirect,
        response_type: 'code',
        scope: typeof permissions === 'string' ? permissions : permissions.join(',')
    }, this.details));
};

/**
 * Returns the access token, if any, or undefined.
 * @return {String}
 */
OAuthProvider.prototype.accessToken = function () {
    return this.tokens.access;
};

/**
 * Returns the refresh token, if any, or undefined.
 * @return {String}
 */
OAuthProvider.prototype.refreshToken = function () {
    return this.tokens.refresh;
};

/**
 * Returns the date that the current tokens expire. You must refresh
 * before then, or reauthenticate.
 * @return {Date}
 */
OAuthProvider.prototype.expires = function () {
    return this.tokens.expires;
};

/**
 * Returns the set of tokens. These can be saved and used to
 * reload the provider later using OAuthProvider.fromTokens.
 * @return {Object}
 */
OAuthProvider.prototype.getTokens = function () {
    return this.tokens;
};

/**
 * Unpacks data from a token response.
 * @param  {Object} res
 * @private
 */
OAuthProvider.prototype.unpackResponse = function (res) {
    if (res.statusCode !== 200) {
        throw new errors.AuthenticationFailedError(res);
    }

    this.tokens = {
        access: res.body.access_token,
        refresh: res.body.refresh_token,
        expires: new Date(Date.now() + res.body.expires_in * 1000)
    };
}

/**
 * Attempts to authenticate based on a query string, gotten from
 * redirecting back from the authorization url (see .getRedirect).
 *
 * Returns a promise which is rejected if there was an error
 * in obtaining authentication.
 *
 * @param {String} redirect The redirect URI that the client was
 *                          originally sent with.
 * @param  {Object} qs The parsed query string they currently have.
 * @return {Promise}
 */
OAuthProvider.prototype.attempt = Bluebird.method(function (redirect, qs) {
    if (qs.error) {
        throw new errors.AuthenticationFailedError(
            qs.error_description || 'Error from oauth: ' + qs.error);
    }

    if (!qs.code) {
        throw new errors.AuthenticationFailedError('No error was given, ' +
            'but a code was not present in the query string. Make sure ' +
            'you\'re using the oauth client correctly.'); // silly devlopers
    }

    return this.client.request('post', '/oauth/token', {
        form: _.extend({
            grant_type: 'authorization_code',
            code: qs.code,
            redirect_uri: redirect
        }, this.details)
    }).bind(this).then(this.unpackResponse);
});

/**
 * Refreshes the authentication tokens, bumping the expires time.
 * @return {Promise}
 */
OAuthProvider.prototype.refresh = Bluebird.method(function () {
    if (!this.tokens.refresh) {
        throw new errors.AuthenticationFailedError('Attempted to ' +
            'refresh without a refresh token present.');
    }

    return this.client.request('post', '/oauth/token', {
        form: _.extend({
            grant_type: 'refresh_token',
            refresh_token: this.tokens.refresh
        }, this.details)
    }).bind(this).then(this.unpackResponse);
});

OAuthProvider.prototype.getRequest = function () {
    if (!this.isAuthenticated()) return {};

    return {
        headers: { Authorization: 'Bearer ' + this.tokens.access }
    };
};

module.exports = OAuthProvider;
