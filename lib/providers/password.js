var request = require('request');
var errors = require('../errors');

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
    // Jar for storing the session cookie
    this.jar = request.jar();
    // storage of the CSRF Token as given in the response from the server
    this.csrfToken = null;
    this.auth = options;
    this.client = client;
}

PasswordProvider.CSRF_TOKEN_LOCATION = 'x-csrf-token';

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
        this.setCSRFToken(res.headers[PasswordProvider.CSRF_TOKEN_LOCATION]);
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

/**
 * Set the CSRF token to be used in all requests with this provider
 */
PasswordProvider.prototype.setCSRFToken = function (token) {
    this.csrfToken = token;
};

module.exports = PasswordProvider;
