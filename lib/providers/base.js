/**
 * Basic provider "interface" from which Password, OAuth, and other
 * providers inherit. This should generally not be used directly.
 * @abstract
 * @access public
 */
function BaseProvider () {
    this.client = null;
    this.authenticated = false;
}

/**
 * Sets the Client instance to user for this provider.
 * @access public
 * @param  {Client} client
 * @return {BaseProvider}
 */
BaseProvider.prototype.use = function (client) {
    this.client = client;
    return this;
};

/**
 * Returns whether this client is authenticated.
 * @access public
 * @return {Boolean}
 */
BaseProvider.prototype.isAuthenticated = function () {
    return this.authenticated;
};

/**
 * Gets an object to be passed into the request module so that
 * authentication, if any, is granted to that request.
 * @return {Object}
 */
BaseProvider.prototype.getRequest = function () {
    return {};
};

module.exports = BaseProvider;
