var util = require('util');

function AuthenticationFailedError () {
    Error.call(this);
    this.message = 'Authentication has failed';
}

function ResponseError (res) {
    Error.call(this);
    this.res = res;
}

function UnknownCodeError (res) {
    ResponseError.call(this, res);
    this.message = 'An unknown error occured';
}

function NotAuthenticatedError (res) {
    ResponseError.call(this, res);
    this.message = 'You do not have permission to view this.';
}

util.inherits(ResponseError, Error);
util.inherits(AuthenticationFailedError, Error);
util.inherits(UnknownCodeError, Error);
util.inherits(NotAuthenticatedError, Error);

module.exports = {
    AuthenticationFailedError: AuthenticationFailedError,
    UnknownCodeError: UnknownCodeError,
    NotAuthenticatedError: NotAuthenticatedError
};
