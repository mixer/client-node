import { EventEmitter } from 'events';
import * as NodeWebSocket from 'ws';

import {
    IChatMessage,
    IDeleteMessage,
    IPollEvent,
    IPurgeMessage,
    IUserAuthenticated,
    IUserConnection,
    IUserTimeout,
    IUserUpdate,
} from '../defs/chat';
import { AuthenticationFailedError, BadMessageError, NoMethodHandlerError, TimeoutError } from '../errors';
import { Reply } from './Reply';

// The method of the authentication packet to store.
const authMethod = 'auth';

/**
 * Return a promise which is rejected with a TimeoutError after the
 * provided delay.
 * @param  {Number} delay
 * @return {Promise}
 */
function timeout(delay: number): Promise<void> {
    return new Socket.Promise<void>((_resolve, reject) => {
        setTimeout(() => reject(new TimeoutError()), delay);
    });
}

function isBrowserWebSocket(socket: any): socket is WebSocket {
    return !socket.ping;
}

function isNodeWebSocket(socket: any): socket is NodeWebSocket {
    return !isBrowserWebSocket(socket);
}

/**
 * Wraps a DOM socket with EventEmitter-like syntax.
 */
export function wrapDOM(socket: WebSocket) {
    function wrapHandler(event: string, fn: (ev: Event) => void) {
        return (ev: Event) => {
            if (event === 'message') {
                fn((<MessageEvent>ev).data);
            } else {
                fn(ev);
            }
        };
    }

    (<any>socket).on = (event: string, listener: (ev: MessageEvent) => void) => {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, wrapped);
    };

    (<any>socket).once = (event: string, listener: (ev: MessageEvent) => void) => {
        const wrapped = wrapHandler(event, listener);
        socket.addEventListener(event, ev => {
            wrapped(ev);
            socket.removeEventListener(event, wrapped);
        });
    };

    return socket;
}

export interface IGenericWebSocket {
    // tslint:disable-next-line: no-misused-new
    new (address: string, subprotocols?: string[]): IGenericWebSocket;
    close(): void;
    on(ev: string, listener: (arg: any) => void): this;
    once(ev: string, listener: (arg: any) => void): this;
    send(data: string): void;
}

export interface ICallOptions {
    /**
     * Set to false if you want a Promise to return for when the event is sent and received by the chat server.
     */
    noReply?: boolean;
    /**
     * Set to true if you want to force send a event to the server.
     */
    force?: boolean;

    /**
     * Call timeout.
     */
    timeout?: number;
}

/**
 * Manages a connect to Mixer's chat servers.
 */
export class Socket extends EventEmitter {
    private _addressOffset: number;
    // Spool to store events queued when the connection is lost.
    private _spool: { data: any, resolve: any }[] = [];
    private _addresses: string[];
    // The WebSocket instance we're currently connected with.
    private ws: IGenericWebSocket;
    private _pingTimeoutHandle: NodeJS.Timer | number;
    // Counter of the current number of reconnect retries, and the number of
    // retries before we reset our reconnect attempts.
    private _retries: number = 0;
    private _retryWrap: number = 7; // max 2 minute retry time;
    private _reconnectTimeout: NodeJS.Timer | number;
    private _callNo: number;
    private status: number;
    private _authpacket: [number, number, string];
    private _replies: { [key: string]: Reply };

    /**
     * We've not tried connecting yet
     */
    public static IDLE = 0;
    /**
     * We successfully connected
     */
    public static CONNECTED = 1;
    /**
     * The socket was is closing gracefully.
     */
    public static CLOSING = 2;
    /**
     * The socket was closed gracefully.
     */
    public static CLOSED = 3;
    /**
     * We're currently trying to connect.
     */
    public static CONNECTING = 4;

    // tslint:disable-next-line variable-name
    public static Promise: typeof Promise = Promise;

    public on(event: 'reconnecting', cb: (data: { interval: number, socket: WebSocket }) => any): this;
    public on(event: 'connected', cb: () => any): this;
    public on(event: 'closed', cb: () => any): this;
    public on(event: 'error', cb: (err: Error) => any): this;
    public on(event: 'authresult', cb: (res: IUserAuthenticated) => any): this;
    public on(event: 'packet', cb: (packet: any) => any): this;
    public on(event: 'ChatMessage', cb: (message: IChatMessage) => any): this;
    public on(event: 'ClearMessages', cb: () => void): this;
    public on(event: 'DeleteMessage', cb: (message: IDeleteMessage) => any): this;
    public on(event: 'PollStart', cb: (poll: IPollEvent) => any): this;
    public on(event: 'PollEnd', cb: (poll: IPollEvent) => any): this;
    public on(event: 'PurgeMessage', cb: (purge: IPurgeMessage) => any): this;
    public on(event: 'UserJoin', cb: (join: IUserConnection) => any): this;
    public on(event: 'UserLeave', cb: (join: IUserConnection) => any): this;
    public on(event: 'UserTimeout', cb: (timeout: IUserTimeout) => any): this;
    public on(event: 'UserUpdate', cb: (update: IUserUpdate) => any): this;
    // tslint:disable-next-line: no-unnecessary-override
    public on(event: string, cb: any): this {
        return super.on(event, cb);
    }

    constructor(
        private wsCtor: IGenericWebSocket,
        addresses: string[],
        private options: {
            pingInterval: number,
            pingTimeout: number,
            callTimeout: number,
            protocolVersion?: string,
        },
    ) {
        super();

        this.options = Object.assign(
            {
                pingInterval: 15 * 1000,
                pingTimeout: 5 * 1000,
                callTimeout: 20 * 1000,
                protocolVersion: '1.0',
            },
            options,
        );

        // Which connection we use in our load balancing.
        this._addressOffset = Math.floor(Math.random() * addresses.length);

        // List of addresses we can connect to.
        this._addresses = addresses;

        // Information for server pings. We ping the server on the interval
        // (if we don't get any other packets) and consider a connection
        // dead if it doesn't respond within the timeout.
        this._pingTimeoutHandle = null;

        // The status of the socket connection.
        this.status = Socket.IDLE;

        // Timeout waiting to reconnect
        this._reconnectTimeout = null;

        // Map of call IDs to promises that should be resolved on
        // method responses.
        this._replies = {};

        // Authentication packet store that we'll resend if we have to reconnect.
        this._authpacket = null;

        // Counter for method calls.
        this._callNo = 0;
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
        return this.status === Socket.CONNECTED;
    }

    /**
     * Retrieves a chat endpoint to connect to. We use round-robin balancing.
     */
    protected getAddress(): string {
        if (++this._addressOffset >= this._addresses.length) {
            this._addressOffset = 0;
        }

        return this._addresses[this._addressOffset];
    }

    /**
     * Returns how long to wait before attempting to reconnect. This does TCP-style
     * limited exponential backoff.
     */
    private getNextReconnectInterval(): number {
        const power = (this._retries++ % this._retryWrap) + Math.round(Math.random());
        return (1 << power) * 500;
    }

    /**
     * handleClose is called when the websocket closes or emits an error. If
     * we weren't gracefully closed, we'll try to reconnect.
     */
    private handleClose() {
        clearTimeout(<number>this._pingTimeoutHandle);
        this._pingTimeoutHandle = null;
        const socket = this.ws;
        this.ws = null;
        this.removeAllListeners('WelcomeEvent');

        if (this.status === Socket.CLOSING) {
            this.status = Socket.CLOSED;
            this.emit('closed');
            return;
        }

        const interval = this.getNextReconnectInterval();
        this.status = Socket.CONNECTING;
        this._reconnectTimeout = setTimeout(this.boot.bind(this), interval);
        this.emit('reconnecting', { interval: interval, socket });
    }

    /**
     * Sets the socket to send a ping message after an interval. This is
     * called when a successful ping is received and after data is received
     * from the socket (there's no need to ping when we know the socket
     * is still alive).
     */
    private resetPingTimeout() {
        clearTimeout(<number>this._pingTimeoutHandle);

        this._pingTimeoutHandle = setTimeout(() => this.ping().catch(() => undefined), this.options.pingInterval);
    }

    /**
     * Resets the connection timeout handle. This will run the handler
     * after a short amount of time.
     */
    private resetConnectionTimeout(handler: () => void) {
        clearTimeout(<number>this._pingTimeoutHandle);
        this._pingTimeoutHandle = setTimeout(handler, this.options.pingTimeout);
    }

    /**
     * Ping runs a ping against the server and returns a promise which is
     * resolved if the server responds, or rejected on timeout.
     */
    public ping(): Promise<void> {
        const { ws } = this;
        clearTimeout(<number>this._pingTimeoutHandle);

        if (!this.isConnected()) {
            return new Socket.Promise<void>((_resolve, reject) => {
                reject(new TimeoutError());
            });
        }

        let promise: Promise<any>;

        if (isNodeWebSocket(ws)) {
            // Node's ws module has a ping function we can use rather than
            // sending a message. More lightweight, less noisy.
            promise = Socket.Promise.race([
                timeout(this.options.pingTimeout),
                new Socket.Promise<void>(resolve => ws.once('pong', resolve)),
            ]);
            ws.ping();
        } else {
            // Otherwise we'll resort to sending a ping message over the socket.
            promise = this.call('ping', [], { timeout: this.options.pingTimeout });
        }

        return promise
        .then(this.resetPingTimeout.bind(this))
        .catch((err: Error) => {
            if (!(err instanceof TimeoutError)) {
                throw err;
            }

            // If we haven't noticed the socket is dead since we started trying
            // to ping, manually emit an error. This'll cause it to close.
            if (this.ws === ws) {
                this.emit('error', err);
                ws.close();

                // trigger a close immediately -- some browsers are slow about this,
                // leading to a delay before we try reconnecting.
                this.handleClose();
            }

            throw err;
        });
    }

    /**
     * Starts a socket client. Attaches events and tries to connect to a
     * chat server.
     * @access public
     * @fires Socket#connected
     * @fires Socket#closed
     * @fires Socket#error
     */
    public boot() {
        const ws = this.ws = new this.wsCtor(
            this.getAddress(),
            [`mixer-chat-${this.options.protocolVersion}`],
        );

        if (isBrowserWebSocket(ws)) {
            wrapDOM(<WebSocket><any>ws);
        }
        const whilstSameSocket = (fn: (...inArgs: any[]) => void) => {
            return (...args: any[]) => {
                if (this.ws === ws) {
                    fn.apply(this, args);
                }
            };
        };

        this.status = Socket.CONNECTING;

        // If the connection doesn't open fast enough
        this.resetConnectionTimeout(() => { ws.close(); });

        // Websocket connection has been established.
        ws.on('open', whilstSameSocket(() => {
            // If we don't get a WelcomeEvent, kill the connection
            this.resetConnectionTimeout(() => { ws.close(); });
        }));

        // Chat server has acknowledged our connection
        this.once('WelcomeEvent', (...args: any[]) => {
            this.resetPingTimeout();
            this.unspool.apply(this, args);
        });

        // We got an incoming data packet.
        ws.on('message', whilstSameSocket((...args: any[]) => {
            this.resetPingTimeout();
            this.parsePacket.apply(this, args);
        }));

        // Websocket connection closed
        ws.on('close', whilstSameSocket(() => {
            this.handleClose();
        }));

        // Websocket hit an error and is about to close.
        ws.on('error', whilstSameSocket((err: Error) => {
            this.emit('error', err);
            ws.close();
        }));

        return this;
    }

    /**
     * Should be called on reconnection. Authenticates and sends follow-up
     * packets if we have any. After we get re-established with auth
     * we'll formally say this socket is connected. This is to prevent
     * race conditions where packets could get send before authentication
     * is reestablished.
     */
    protected unspool() {
        // Helper function that's called when we're fully reestablished and
        // ready to take direct calls again.
        const bang = () => {
            // Send any spooled events that we have.
            for (let i = 0; i < this._spool.length; i++) {
                // tslint:disable-next-line no-floating-promises
                this.send(this._spool[i].data, { force: true })
                .catch(err => {
                    this.emit('error', err);
                });
                this._spool[i].resolve();
            }
            this._spool = [];

            // Finally, tell the world we're connected.
            this._retries = 0;
            this.status = Socket.CONNECTED;
            this.emit('connected');
        };

        // If we already authed, it means we're reconnecting and should
        // establish authentication again.
        if (this._authpacket) {
            // tslint:disable-next-line no-floating-promises
            this.call(authMethod, this._authpacket, { force: true })
            .then(result => this.emit('authresult', result))
            .then(bang)
            .catch(() => {
                this.emit('error', new AuthenticationFailedError('?'));
                this.close();
            });
        } else {
            // Otherwise, we can reestablish immediately
            bang();
        }
    }

    /**
     * Parses an incoming packet from the websocket.
     * @fires Socket#error
     * @fires Socket#packet
     */
    protected parsePacket(data: string, flags?: { binary: boolean }) {
        if (flags && flags.binary) {
            // We can't handle binary packets. Why the fudge are we here?
            this.emit('error', new BadMessageError('Cannot parse binary packets. Wat.'));
            return;
        }

        // Unpack the packet data.
        let packet: { id: number, type: string, event: any, data: any, error: string };
        try {
            packet = JSON.parse(data);
        } catch (e) {
            this.emit('error', new BadMessageError('Unable to parse packet as json'));
            return;
        }

        this.emit('packet', packet);

        switch (packet.type) {
        case 'reply':
            // Try to look up the packet reply handler, and call it if we can.
            const reply = this._replies[packet.id];
            if (reply !== undefined) {
                reply.handle(packet);
                delete this._replies[packet.id];
            } else {
                // Otherwise emit an error. This might happen occasionally,
                // but failing silently is lame.
                this.emit('error', new NoMethodHandlerError('No handler for reply ID.'));
            }
            break;
        case 'event':
            // Just emit events out on this emitter.
            this.emit(packet.event, packet.data);
            break;
        default:
            this.emit('error', new BadMessageError('Unknown packet type ' + packet.type));
        }
    }

    /**
     * Sends raw packet data to the server. It may not send immediately;
     * if we aren't connected, it'll just be spooled up.
     *
     * @fires Socket#sent
     * @fires Socket#spooled
     */
    protected send(
        // tslint:disable-next-line no-banned-terms
        data: { id: number, type: string, method: string, arguments: any[] },
        options: { force?: boolean } = {},
    ): Promise<void> {
        if (this.isConnected() || options.force) {
            this.ws.send(JSON.stringify(data));
            this.emit('sent', data);
            return Socket.Promise.resolve();
        } else if (data.method !== authMethod) {
            return new Socket.Promise<void>(resolve => {
                this._spool.push({ data: data, resolve });
                this.emit('spooled', data);
            });
        }

        return Socket.Promise.resolve();
    }

    /**
     * auth sends a packet over the socket to authenticate with a chat server
     * and join a specified channel. If you wish to join anonymously, user
     * and authkey can be omitted.
     */
    public auth(id: number, user: number, authkey: string, accessKey?: string): Promise<IUserAuthenticated> {
        this._authpacket = [id, user, authkey, accessKey];

        // Two cases here: if we're already connected, with send the auth
        // packet immediately. Otherwise we wait for a `connected` event,
        // which won't be sent until after we re-authenticate.
        if (this.isConnected()) {
            return this.call('auth', [id, user, authkey, accessKey]);
        }

        return new Socket.Promise(resolve => this.once('authresult', resolve));
    }

    /**
     * Runs a method on the socket. Returns a promise that is rejected or
     * resolved upon reply.
     */
    public call(method: 'auth', args: [number], options?: ICallOptions): Promise<IUserAuthenticated>;
    public call(method: 'auth', args: [number, number, string], options?: ICallOptions): Promise<IUserAuthenticated>;
    public call(method: 'msg', args: [string], options?: ICallOptions): Promise<IChatMessage>;
    public call(method: 'whisper', args: [string, string], options?: ICallOptions): Promise<any>;
    public call(method: 'history', args: [number], options?: ICallOptions): Promise<IChatMessage[]>;
    public call(method: 'timeout', args: [string, string], options?: ICallOptions): Promise<string>;
    public call(method: 'ping', args: [any]): Promise<any>;
    public call(method: 'vote:start', args: [string, string[], number]): Promise<void>;
    public call(method: string, args: (string|number)[], options?: ICallOptions): Promise<any>;
    public call<T>(method: string, args: any[] = [], options: ICallOptions = {}): Promise<T | void> {
        // Send out the data
        const id = this._callNo++;

        // This is created before we call and wait on .send purely for ease
        // of use in tests, so that we can mock an incoming packet synchronously.
        const replyPromise = new Socket.Promise((resolve, reject) => {
            this._replies[id] = new Reply(resolve, reject);
        });

        return this.send(
            {
                type: 'method',
                method: method,
                arguments: args,
                id: id,
            },
            options,
        )
        .then(() => {
            // Then create and return a promise that's resolved when we get
            // a reply, if we expect one to be given.
            if (options.noReply) {
                return undefined;
            }

            return Socket.Promise.race([
                <Promise<T>><any>timeout(options.timeout || this.options.callTimeout),
                <Promise<T>>replyPromise,
            ]);
        })
        .catch((err: Error) => {
            if (err instanceof TimeoutError) {
                delete this._replies[id];
            }
            throw err;
        });
    }

    /**
     * Closes the websocket gracefully.
     */
    public close() {
        if (this.ws) {
            this.ws.close();
            this.status = Socket.CLOSING;
        } else {
            clearTimeout(<number>this._reconnectTimeout);
            this.status = Socket.CLOSED;
        }
    }
}
