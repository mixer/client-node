var isNode = typeof window === 'undefined';
var WebSocket = isNode ? require('ws') : window.WebSocket;

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 * @param  {Socket} socket
 * @return {Socket}
 */
function wrapDOM (socket) {
    function wrapHandler (event, fn) {
        return function (ev) {
            if (event === 'message') {
                fn(ev.data);
            } else {
                fn(ev);
            }
        };
    }

    socket.on = function (event, listener) {
        var wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, wrapped);
    };

    socket.once = function (event, listener) {
        var wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, function (ev) {
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
    var ws = new WebSocket(address);
    if (!isNode) {
        ws = wrapDOM(ws);
    }

    return ws;
};
