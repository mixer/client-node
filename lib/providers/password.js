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
    this.auth = options;
    this.client = client;
}

/**
 * Attempts to authenticate with the given details. Resolves
 * with user information iff correct.
 * @return {Promise}
 */
PasswordProvider.prototype.attempt = function () {
    return this.client.request('post', '/users/login', { form: this.auth }).then(function (res) {
        if (res.statusCode !== 200) {
            throw new errors.AuthenticationFailedError(res);
        } else {
            return res;
        }
    });
};

/**
 * Returns info to add to the client's request.
 * @private
 */
PasswordProvider.prototype.getRequest = function () {
    return { jar: this.jar };
};

module.exports = PasswordProvider;
