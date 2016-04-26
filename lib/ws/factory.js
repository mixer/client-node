var NodeWS = require('ws');
var isNode = typeof window === 'undefined';

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapDOM(socket) {
    function wrapHandler(event, fn) {
        return (ev) => {
            if (event === 'message') {
                fn(ev.data);
            } else {
                fn(ev);
            }
        };
    }

    socket.on = function (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, wrapped);
    };

    socket.once = function (event, listener) {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, (ev) => {
            wrapped(ev);
            socket.removeEventListener(event, wrapped);
        });
    };

    return socket;
}

/**
 * Factory function to create a websocket. Lets us mock it later.
 * @param  {String} address
 * @return {WebSocket}
 */
module.exports.create = function (address) {
    if (isNode) {
        return new NodeWS(address);
    }

    return wrapDOM(new WebSocket(address));
};
