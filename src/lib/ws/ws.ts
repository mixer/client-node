import * as _ from "lodash";
import Bluebird = require("bluebird");
import WebSocket = require("ws");
import { EventEmitter } from "events";

import Errors = require("../errors");
import Reply = require("./reply");
import factory = require("./factory");

// The method of the authentication packet to store.
const authMethod = "auth";

export class BeamSocket extends EventEmitter {
    public static Promise: any;
    public static TimeoutError = TimeoutError;

    public ws: WebSocket = null;
    public status: SocketStatus = 0;

    private addressOffset: number;
    private spool: any[] = [];
    private pingTimeoutHandle: NodeJS.Timer = null;
    private pingInterval: number;
    private pingTimeout: number;
    private retries: number = 0;
    private retryWrap: number = 7;
    private reconnectTimeout: any = null;
    private callTimeout: number;
    private replies: Object = {};
    private authPacket: [number, number, string] = null;
    private callNo: number = 0;

    constructor(public addresses: string[], options: {
        pingInterval: number,
        pingTimeout: number,
        callTimeout: number
    }) {
        super();
        // Set the offset.
        this.addressOffset = Math.floor(Math.random() * addresses.length);
        // Set the options.
        let opts = _.assign({
            callTimeout: 20 * 1000,
            pingInterval: 15 * 1000,
            pingTimeout: 5 * 1000,
        }, options) as any;
        this.pingInterval = opts.pingInterval;
        this.pingTimeout = opts.pingTimeout;
        this.callTimeout = opts.callTimeout;
    }

    /**
     * Gets the status of the socket connection.
     */
    public getStatus(): number {
        return this.status;
    }

    /**
     * Returns whether the socket is currently connected.
     */
    public isConnected(): boolean {
        return this.status === SocketStatus.CONNECTED;
    }

    /**
     * Retrieves a chat endpoint to connect to. We use round-robin balancing.
     */
    public getAddress(): string {
        if (++this.addressOffset >= this.addresses.length) {
            this.addressOffset = 0;
        }

        return this.addresses[this.addressOffset];
    }

    public ping(): Bluebird<any> {
        const ws = this.ws;
        clearTimeout(this.pingTimeoutHandle);

        if (!this.isConnected()) {
            return new BeamSocket.Promise((resolve, reject) => {
                reject(new TimeoutError());
            });
        }

        let promise: Bluebird<any> = null;

        if (typeof ws.ping === "function") {
            promise = race([
                timeout(this.pingTimeout),
                new BeamSocket.Promise((resolve) => {
                    ws.once("pong", resolve);
                }),
            ]);
            ws.ping();
        } else {
            promise = this.call("ping", [], { timeout: this.pingTimeout });
        }

        return promise
            .then(this.resetPingTimeout.bind(this))
            .catch(TimeoutError, (err) => {
                if (this.ws === ws) {
                    this.ws.emit("error", err);
                }
                throw err;
            });
    }

    /**
     * Starts a socket client. Attaches events and tries to connect to a
     * chat server.
     */
    public boot(): BeamSocket {
        let self = this;
        let ws = this.ws = factory.create(this.getAddress());
        this.status = SocketStatus.CONNECTING;

        ws.on("open", function() {
            self.resetPingTimeout();
            self.unspool.apply(self, arguments);
        });

        ws.on("message", function() {
            self.resetPingTimeout();
            self.parsePacket.apply(self, arguments);
        });

        ws.on("close", function() {
            self.handleClose.apply(self, arguments);
        });

        ws.on("error", function(err) {
            self.emit("error", err);
            ws.close();
        });

        return this;
    }

    /**
     * Should be called on reconnection. Authenticates and sends follow-up
     * packets if we have any. After we get re-established with auth
     * we'll formally say this socket is connected. This is to prevent
     * race conditions where packets could get send before authentication
     * is reestablished.
     */
    public unspool() {
        let self = this;

        /**
         * Helper function that's called when we're fully reestablished and
         * ready to take direct calls again.
         */
        function bang() {
            for (let i = 0, length = self.spool.length; i < length; i++) {
                self.send(self.spool[i], { force: true });
            }
            self.spool = [];

            // Finally, tell the world we're connected.
            self.retries = 0;
            self.status = SocketStatus.CONNECTED;
            self.emit("connected");

            // Clean up for gc
            self = null;
        }

        if (this.authPacket) {
            this.call(authMethod, this.authPacket, { force: true })
                .then(function (res) {
                    self.emit("authresult", res);
                })
                .then(bang)
                .catch(function () {
                    self.emit("error", new Errors.AuthenticationFailedError());
                    self.ws.close();
                });
        } else {
            bang();
        }
    }

    /**
     * Parses an incoming packet from the websocket.
     */
    public parsePacket(data: any, flags: { binary: boolean }) {
        if (flags && flags.binary) {
            this.emit("error", new Errors.BadMessageError("Cannot parse binary packets. Wat."));
            return;
        }

        // Unpack the packet data.
        let packet: any = null;
        try {
            packet = JSON.parse(data);
        } catch (e) {
            this.emit("error", new Errors.BadMessageError("Unable to parse packet as JSON."));
            return;
        }

        this.emit("packet", packet);

        switch (packet.type) {
            case "reply":
                // Try to look up the packet reply handler, and call it if we can.
                let reply = this.replies[packet.id];
                if (typeof reply !== "undefined") {
                    reply.handle(packet);
                    delete this.replies[packet.id];
                } else {
                    // Otherwise emit an error. This might happen occasionally, but failing silently is lame.
                    this.emit("error", new Errors.NoMethodHandlerError("No handler for reply ID."));
                }
                break;
            case "event":
                // Just emit events out on this emitter.
                this.emit(packet.event, packet.data);
                break;
            default:
                this.emit("error", new Errors.BadMessageError(`Unknown packet type ${packet.type}`));
        }
    }

    /**
     * Sends raw packet data to the server. It may not send immediately;
     * if we aren't connected, it'll just be spooled up.
     */
    public send(data: any, options?: { force?: boolean }) {
        options = options || {};

        if (this.isConnected() || options.force) {
            this.ws.send(JSON.stringify(data));
            this.emit("sent", data);
        } else if (data.method !== authMethod) {
            this.spool.push(data);
            this.emit("spooled", data);
        }
    }

    /**
     * auth sends a packet over the socket to authenticate with a chat server
     * and join a specified channel. If you wish to join anonymously, user
     * and authkey can be omitted.
     */
    public auth(channelId: number, userId?: number, authKey?: string) {
        this.authPacket = [channelId, userId, authKey];

        // Two cases here: if we're already connected, with send the auth
        // packet immediately. Otherwise we wait for a `connected` event,
        // which won't be sent until after we re-authenticate.
        if (this.isConnected()) {
            return this.call("auth", [channelId, userId, authKey]);
        }

        let self = this;
        return new BeamSocket.Promise((resolve) => {
            self.once("authresult", resolve);
        });
    }

    /**
     * Runs a method on the socket. Returns a promise that is rejected or
     * resolved upon reply.
     */
    public call(method: string, oldArgs: any[], oldOptions?: { force?: boolean, noReply?: boolean, timeout?: number }) {
        let options = oldOptions;
        let args = oldArgs;
        if (!Array.isArray(args)) {
            options = args;
            args = [];
        }
        options = options || {};

        // Send out the data.
        let id = this.callNo++;
        let self = this;
        this.send({ arguments: args, id, type: "method", method }, options);

        // Then create and return a promise that's resolved when we get
        // a reply, if we expect one to be given.
        if (options.noReply) {
            return BeamSocket.Promise.resolve();
        }

        return race([
            timeout(options.timeout || this.callTimeout),
            new BeamSocket.Promise(function (resolve, reject) {
                self.replies[id] = new Reply(resolve, reject);
            }),
        ])
        .catch(TimeoutError, function (err) {
            delete self.replies[id];
            throw err;
        });
    }

    /**
     * Closes the websocket gracefully.
     */
    public close() {
        if (this.ws) {
            this.ws.close();
            this.status = SocketStatus.CLOSING;
        } else {
            clearTimeout(this.reconnectTimeout);
            this.status = SocketStatus.CLOSED;
        }
    }

    private getNextReconnectInterval() {
        const power = (this.retries++ % this.retryWrap) + Math.round(Math.random());
        return (1 << power) * 500;
    }

    /**
     * _handleClose is called when the websocket closes or emits an error.
     * If we weren't gracefully closed, we'll try to reconnect.
     */
    private handleClose() {
        clearTimeout(this.pingTimeoutHandle);
        this.pingTimeoutHandle = null;
        this.ws = null;

        if (this.status === SocketStatus.CLOSING) {
            this.status = SocketStatus.CLOSED;
            this.emit("closed");
            return;
        }

        this.status = SocketStatus.CONNECTING;
        this.reconnectTimeout = setTimeout(this.boot.bind(this), this.getNextReconnectInterval());
    }

    /**
     * Sets the socket to send a ping message after an interval. This is
     * called when a successful ping is received and after data is received
     * from the socket (there's no need to ping when we know the socket
     * is still alive).
     */
    private resetPingTimeout() {
        clearTimeout(this.pingTimeoutHandle);

        this.pingTimeoutHandle = setTimeout(() => {
            this.ping().catch(() => { /* Ignore the error */ });
        }, this.pingInterval);
    }
}

function TimeoutError() {
    Error.call(this);
}
TimeoutError.prototype = Object.create(Error.prototype);

/**
 * race takes an array of promises and is resolved with the first promise
 * that resolves, or rejects. After the first resolve or rejection, all
 * future resolutions and rejections will be discarded.
 */
function race(promises: any[]): Bluebird<any[]> {
    return new BeamSocket.Promise((resolve, reject) => {
        let done = false;
        function guard(fn: Function) {
            return function () {
                if (!done) {
                    done = true;
                    fn.apply(null, arguments);
                }
            };
        }

        let resolveInternal = guard(resolve);
        let rejectInternal = guard(reject);

        for (let i = 0, length = promises.length; i < length; i++) {
            promises[i].then(resolveInternal).catch(rejectInternal);
        }
    });
}

/**
 * Return a promise which is rejected with a TimeoutError after the provided delay.
 */
function timeout (delay) {
    return new BeamSocket.Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(new TimeoutError());
        }, delay);
    });
}

try {
    // noinspection TsLint
    BeamSocket.Promise = require("bluebird");
} catch (e) { /* Ignore error */ }

/**
 * Enum for the socket status.
 */
export enum SocketStatus {
    IDLE = 0,
    CONNECTED = 1,
    CLOSING = 2,
    CLOSED = 3,
    CONNECTING = 4,
}
