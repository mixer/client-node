var WebSocket = require('ws');

/**
 * Factor function to create a websocket. Lets us mock it later.
 * @param  {String} address
 * @param  {Array|String=} protocol
 * @param  {Object=} options
 * @return {WebSocket}
 */
module.exports.create = function (address, protocol, options) {
    return new WebSocket(address, protocol, options);
};
