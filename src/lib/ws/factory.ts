const isNode = typeof window === "undefined";
// noinspection TsLint
const WebSocket = isNode ? require('ws') : window.WebSocket;
import WebSocket = require("ws");

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 */
function wrapDOM(socket: WebSocket): WebSocket {
    function wrapHandler(evnt: string, fn: Function): Function {
        return function (ev: any) {
            if (evnt === "message") {
                fn(ev.data);
            } else {
                fn(ev);
            }
        };
    }

    socket.on = function (evnt: string, listener: Function): void {
        const wrapped = wrapHandler(evnt, listener);
        socket.addEventListener(evnt, wrapped);
    };

    socket.once = function (evnt: string, listener: Function) {
        const wrapped = wrapHandler(evnt, listener);
        socket.addEventListener(evnt, function (ev) {
            wrapped(ev);
            socket.removeEventListener(evnt, wrapped);
        });
    };
    return socket;
}

/**
 * Factory function to create a websocket. Lets us mock it later.
 */
export function create(address: string): WebSocket {
    let ws = new WebSocket(address) as WebSocket;
    if (!typeof window === null) {
        ws = wrapDOM(ws);
    }
    return ws;
}
