/**
 * Simple wrapper that waits for a dispatches a method reply.
 * @param {Function} resolve
 * @param {Function} reject
 */
function Reply (resolve, reject) {
    this.resolve = resolve;
    this.reject = reject;
}

/**
 * Handles "reply" packet data from the websocket.
 * @param  {Object} packet
 */
Reply.prototype.handle = function (packet) {
    if (packet.error) {
        this.reject(packet.error);
    } else {
        this.resolve(packet.data);
    }
};

module.exports = Reply;
