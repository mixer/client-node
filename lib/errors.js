var util = require('util');

/**
 * Emitted when we try to connect to the Beam API, but have invalid
 * credentials.
 * @access public
 * @param {String} [message]
 */
function AuthenticationFailedError (message) {
    Error.call(this);
    this.message = message || 'Authentication has failed';
}

/**
 * Emitted by our WebSocket when we get a bad packet; one that is binary,
 * we can't decode, or has a type we don't know about.
 * @access public
 * @param {String} message
 */
function BadMessageError (message) {
    Error.call(this);
    this.message = message;
}

/**
 * Emitted by our WebSocket when we get get a "reply" to a method
 * that we don't have a handler for.
 * @access public
 * @param {String} message
 */
function NoMethodHandlerError (message) {
    Error.call(this);
    this.message = message;
}

/**
 * Basic "response" error message from which others inherit.
 * @access public
 * @abstract
 * @param {Object} res
 */
function ResponseError (res) {
    Error.call(this);
    this.res = res;
}

/**
 * Happens when we get a code from the API that we don't expect.
 * @access public
 * @augments ResponseError
 * @param {Object} res
 */
function UnknownCodeError (res) {
    ResponseError.call(this, res);
    this.message = 'An unknown error occurred';
}

/**
 * Happens when we attempt to access a point that needs authentication
 * or access that we don't have.
 * @access public
 * @augments ResponseError
 * @param {Object} res
 */
function NotAuthenticatedError (res) {
    ResponseError.call(this, res);
    this.message = 'You do not have permission to view this.';
}

util.inherits(ResponseError, Error);
util.inherits(AuthenticationFailedError, Error);
util.inherits(UnknownCodeError, Error);
util.inherits(NotAuthenticatedError, Error);
util.inherits(BadMessageError, Error);
util.inherits(NoMethodHandlerError, Error);

module.exports = {
    AuthenticationFailedError: AuthenticationFailedError,
    UnknownCodeError: UnknownCodeError,
    NotAuthenticatedError: NotAuthenticatedError,
    BadMessageError: BadMessageError,
    NoMethodHandlerError: NoMethodHandlerError,
};
