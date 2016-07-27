var request = require('request');
var errors = require('../errors');
var Provider = require('./provider');
var Bluebird = require('bluebird');

/**
 * Provider for password-based authentication.
 *
 * @access public
 * @augments BaseProvider
 * @param {Client} client
 * @param {Object} options
 * @param {String} options.username Username of whoever is logging in...
 * @param {String} options.password Their password...
 * @param {String} [options.code]   The user two factor auth code, necessary if they
 *                                  have 2fa enabled.
 */
function PasswordProvider (client, options) {
    Provider.apply(this, arguments);
    // Jar for storing the session cookie
    this.jar = request.jar();
    // storage of the CSRF Token as given in the response from the server
    this.csrfToken = null;
    this.auth = options;
}

PasswordProvider.CSRF_TOKEN_LOCATION = 'x-csrf-token';
PasswordProvider.INVALID_CSRF_CODE = 461;

/**
 * Attempts to authenticate with the given details. Resolves
 * with user information if correct.
 * @return {Promise}
 */
PasswordProvider.prototype.attempt = function () {
    return this.client.request('post', '/users/login', { form: this.auth }).then(function (res) {
        if (res.statusCode !== 200) {
            throw new errors.AuthenticationFailedError(res);
        }
        this.csrfToken = res.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
        return res;
    }.bind(this));
};

/**
 * Returns info to add to the client's request.
 * @private
 */
PasswordProvider.prototype.getRequest = function () {
    var req = {
        jar: this.jar,
        headers: {},
    };
    req.headers[PasswordProvider.CSRF_TOKEN_LOCATION] = this.csrfToken;
    return req;
};

PasswordProvider.prototype.handleResponseError = function (err, requestOptions) {
    if (err.statusCode === PasswordProvider.INVALID_CSRF_CODE) {
        if (err.headers[PasswordProvider.CSRF_TOKEN_LOCATION] !== this.csrfToken) {
            this.csrfToken = err.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
            return this.client.request.apply(this.client, requestOptions);
        }
    }
    return Bluebird.reject(err);
};

module.exports = PasswordProvider;
