var Base = require('./base');
var request = require('request');
var errors = require('../errors');

/**
 * Provider for password-based authentication.
 *
 * @access public
 * @param {String} username Username of whoever is logging in...
 * @param {String} password Their password...
 * @param {String} code     The user two factor auth code, necessary if they
 *                          have 2fa enabled.
 */
function PasswordProvider (username, password, code) {
    Base.call(this);

    // Jar for storing the session cookie
    this.jar = request.jar();

    var auth = this.auth = {};
    auth.username = username;
    auth.password = password;
    auth.code = code;
}

PasswordProvider.prototype = new Base();

PasswordProvider.prototype.attempt = function () {
    return this.client.request('post', '/users/login', { form: this.auth }).then(function (res) {
        if (res.statusCode !== 200) {
            throw new errors.AuthenticationFailedError(res);
        } else {
            return res;
        }
    });
};

PasswordProvider.prototype.getRequest = function () {
    return { jar: this.jar };
};

module.exports = PasswordProvider;
