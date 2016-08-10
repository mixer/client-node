var events = require('events');
var _ = require('lodash');

var Reply = require('./reply');
var errors = require('../errors');
var factory = require('./factory');

// The method of the authentication packet to store.
var authMethod = 'auth';

/**
 * A TimeoutError is thrown in call if we don't get a response from the
 * chat server within a certain interval.
 */
function TimeoutError () { Error.call(this); }
TimeoutError.prototype = Object.create(Error.prototype);

/**
 * Manages a connect to Beam's chat servers.
 * @access public
 * @param {Array} addresses
 * @param {Object} options
 * @param {Number} [options.pingInterval=15000] How often to send ping packets
 *     to  make sure the connection is alive. Given in milliseconds.
 * @param {Number} [options.pingTimeout=5000] How long to wait after sending
 *     a ping before, if we don't get a reply, we consider the connection dead.
 * @param {Number} [options.callTimeout=20000] Number of milliseconds to wait
 *     for a reply from the chat server before giving up and rejecting with
 *     a TimeoutError. This can be overridden in the arguments to .call().
 */
function BeamSocket (addresses, options) {
    events.EventEmitter.call(this);

    options = _.assign({
        pingInterval: 15 * 1000,
        pingTimeout: 5 * 1000,
        callTimeout: 20 * 1000,
    }, options);

    // Which connection we use in our load balancing.
    this._addressOffset = Math.floor(Math.random() * addresses.length);

    // List of addresses we can connect to.
    this._addresses = addresses;

    // Spool to store events queued when the connection is lost.
    this._spool = [];

    // The WebSocket instance we're currently connected with.
    this.ws = null;

    // Information for server pings. We ping the server on the interval
    // (if we don't get any other packets) and consider a connection
    // dead if it doesn't respond within the timeout.
    this._pingTimeoutHandle = null;
    this._pingInterval = options.pingInterval;
    this._pingTimeout = options.pingTimeout;

    // The status of the socket connection.
    this.status = BeamSocket.IDLE;

    // Counter of the current number of reconnect retries, and the number of
    // retries before we reset our reconnect attempts.
    this._retries = 0;
    this._retryWrap = 7; // max 2 minute retry time
    // Timeout waiting to reconnect
    this._reconnectTimeout = null;

    // Number of milliseconds to wait in .call() before we give up waiting
    // for the reply. Used to prevent leakages.
    this._callTimeout = options.callTimeout;

    // Map of call IDs to promises that should be resolved on
    // method responses.
    this._replies = {};

    // Authentication packet store that we'll resend if we have to reconnect.
    this._authpacket = null;

    // Counter for method calls.
    this._callNo = 0;
}

BeamSocket.prototype = Object.create(events.EventEmitter.prototype);

/**
 * race takes an array of promises and is resolved with the first promise
 * that resolves, or rejects. After the first resolve or rejection, all
 * future resolutions and rejections will be discarded.
 * @param {Promise[]} promises
 * @return {Promise}
 */
function race (promises) {
    return new BeamSocket.Promise(function (_resolve, _reject) {
        var done = false;
        function guard (fn) {
            return function () {
                if (!done) {
                    done = true;
                    fn.apply(null, arguments);
                }
            };
        }

        var resolve = guard(_resolve);
        var reject = guard(_reject);

        for (var i = 0; i < promises.length; i++) {
            promises[i].then(resolve).catch(reject);
        }
    });
}

/**
 * Return a promise which is rejected with a TimeoutError after the
 * provided delay.
 * @param  {Number} delay
 * @return {Promise}
 */
function timeout (delay) {
    return new BeamSocket.Promise(function (resolve, reject) {
        setTimeout(function () {
            reject(new TimeoutError());
        }, delay);
    });
}

/**
 * Gets the status of the socket connection.
 * @return {status} Should be compared against BeamSocket.status
 */
BeamSocket.prototype.getStatus = function () {
    return this.status;
};

/**
 * Returns whether the socket is currently connected.
 * @return {Boolean}
 */
BeamSocket.prototype.isConnected = function () {
    return this.status === BeamSocket.CONNECTED;
};

/**
 * Retrieves a chat endpoint to connect to. We use round-robin balancing.
 * @access protected
 * @return {String}
 */
BeamSocket.prototype.getAddress = function () {
    if (++this._addressOffset >= this._addresses.length) {
        this._addressOffset = 0;
    }

    return this._addresses[this._addressOffset];
};

/**
 * Returns how long to wait before attempting to reconnect. This does TCP-style
 * limited exponential backoff.
 * @return {Number}
 */
BeamSocket.prototype._getNextReconnectInterval = function () {
    var power = (this._retries++ % this._retryWrap) + Math.round(Math.random());
    return (1 << power) * 500;
};

/**
 * _handleClose is called when the websocket closes or emits an error. If
 * we weren't gracefully closed, we'll try to reconnect.
 */
BeamSocket.prototype._handleClose = function () {
    clearTimeout(this._pingTimeoutHandle);
    this._pingTimeoutHandle = null;
    this.ws = null;

    if (this.status === BeamSocket.CLOSING) {
        this.status = BeamSocket.CLOSED;
        this.emit('closed');
        return;
    }

    this.status = BeamSocket.CONNECTING;
    this._reconnectTimeout = setTimeout(
        this.boot.bind(this),
        this._getNextReconnectInterval()
    );
};

/**
 * Sets the socket to send a ping message after an interval. This is
 * called when a successful ping is received and after data is received
 * from the socket (there's no need to ping when we know the socket
 * is still alive).
 */
BeamSocket.prototype._resetPingTimeout = function () {
    clearTimeout(this._pingTimeoutHandle);

    var self = this;
    this._pingTimeoutHandle = setTimeout(function () {
        self.ping().catch(function () {});
    }, this._pingInterval);
};

/**
 * Ping runs a ping against the server and returns a promise which is
 * resolved if the server responds, or rejected on timeout.
 * @return {Promise}
 */
BeamSocket.prototype.ping = function () {
    var ws = this.ws;
    var self = this;
    clearTimeout(this._pingTimeoutHandle);

    if (!this.isConnected()) {
        return new BeamSocket.Promise(function (resolve, reject) {
            reject(new TimeoutError());
        });
    }

    var promise;

    if (typeof ws.ping === 'function') {
        // Node's ws module has a ping function we can use rather than
        // sending a message. More lightweight, less noisy.
        promise = race([
            timeout(this._pingTimeout),
            new BeamSocket.Promise(function (resolve) {
                ws.once('pong', resolve);
            }),
        ]);
        ws.ping();
    } else {
        // Otherwise we'll resort to sending a ping message over the socket.
        promise = this.call('ping', [], { timeout: this._pingTimeout });
    }

    return promise
    .then(this._resetPingTimeout.bind(this))
    .catch(TimeoutError, function (err) {
        // If we haven't noticed the socket is dead since we started trying
        // to ping, manually emit an error. This'll cause it to close.
        if (self.ws === ws) {
            self.ws.emit('error', err);
        }

        throw err;
    });
};

/**
 * Starts a socket client. Attaches events and tries to connect to a
 * chat server.
 * @access public
 * @fires BeamSocket#connected
 * @fires BeamSocket#closed
 * @fires BeamSocket#error
 */
BeamSocket.prototype.boot = function () {
    var self = this;
    var ws = this.ws = factory.create(this.getAddress());
    this.status = BeamSocket.CONNECTING;

    // Websocket connection has been established.
    ws.on('open', function () {
        self._resetPingTimeout();
        self.unspool.apply(self, arguments);
    });

    // We got an incoming data packet.
    ws.on('message', function () {
        self._resetPingTimeout();
        self.parsePacket.apply(self, arguments);
    });

    // Websocket connection closed
    ws.on('close', function () {
        self._handleClose.apply(self, arguments);
    });

    // Websocket hit an error and is about to close.
    ws.on('error', function (err) {
        self.emit('error', err);
        ws.close();
    });

    return this;
};

/**
 * Should be called on reconnection. Authenticates and sends follow-up
 * packets if we have any. After we get re-established with auth
 * we'll formally say this socket is connected. This is to prevent
 * race conditions where packets could get send before authentication
 * is reestablished.
 * @access protected
 */
BeamSocket.prototype.unspool = function () {
    var self = this;

    // Helper function that's called when we're fully reestablished and
    // ready to take direct calls again.
    function bang () {
        // Send any spooled events that we have.
        for (var i = 0; i < self._spool.length; i++) {
            self.send(self._spool[i].data, { force: true });
            self._spool[i].resolve();
        }
        self._spool = [];

        // Finally, tell the world we're connected.
        self._retries = 0;
        self.status = BeamSocket.CONNECTED;
        self.emit('connected');

        // Clean up for gc
        self = null;
    }

    // If we already authed, it means we're reconnecting and should
    // establish authentication again.
    if (this._authpacket) {
        this.call(authMethod, this._authpacket, { force: true })
        .then(function (result) {
            self.emit('authresult', result);
        })
        .then(bang)
        .catch(function () {
            self.emit('error', new errors.AuthenticationFailedError());
            self.close();
        });
    } else {
        // Otherwise, we can reestablish immediately
        bang();
    }
};

/**
 * Parses an incoming packet from the websocket.
 * @access protected
 * @param  {String} data
 * @param  {Object} flags
 * @fires BeamSocket#error
 * @fires BeamSocket#packet
 */
BeamSocket.prototype.parsePacket = function (data, flags) {
    if (flags && flags.binary) {
        // We can't handle binary packets. Why the fudge are we here?
        this.emit('error', new errors.BadMessageError('Cannot parse binary packets. Wat.'));
        return;
    }

    // Unpack the packet data.
    var packet;
    try {
        packet = JSON.parse(data);
    } catch (e) {
        this.emit('error', new errors.BadMessageError('Unable to parse packet as json'));
        return;
    }

    this.emit('packet', packet);

    switch (packet.type) {
    case 'reply':
        // Try to look up the packet reply handler, and call it if we can.
        var reply = this._replies[packet.id];
        if (typeof reply !== 'undefined') {
            reply.handle(packet);
            delete this._replies[packet.id];
        } else {
            // Otherwise emit an error. This might happen occasionally,
            // but failing silently is lame.
            this.emit('error', new errors.NoMethodHandlerError('No handler for reply ID.'));
        }
        break;
    case 'event':
        // Just emit events out on this emitter.
        this.emit(packet.event, packet.data);
        break;
    default:
        this.emit('error', new errors.BadMessageError('Unknown packet type ' + packet.type));
    }
};

/**
 * Sends raw packet data to the server. It may not send immediately;
 * if we aren't connected, it'll just be spooled up.
 *
 * @access protected
 * @param  {Object} data
 * @param  {Object} options_
 * @return {Promise} resolved once the packet is sent
 * @fires BeamSocket#sent
 * @fires BeamSocket#spooled
 */
BeamSocket.prototype.send = function (data, options_) {
    var options = options_ || {};
    var self = this;

    if (this.isConnected() || options.force) {
        this.ws.send(JSON.stringify(data));
        this.emit('sent', data);
        return BeamSocket.Promise.resolve();
    } else if (data.method !== authMethod) {
        return new BeamSocket.Promise(function (resolve) {
            self._spool.push({ data: data, resolve: resolve });
            self.emit('spooled', data);
        });
    }

    return BeamSocket.Promise.resolve();
};

/**
 * auth sends a packet over the socket to authenticate with a chat server
 * and join a specified channel. If you wish to join anonymously, user
 * and authkey can be omitted.
 * @param  {Number} id
 * @param  {Number} [user]
 * @param  {String} [authkey]
 * @return {Promise}
 */
BeamSocket.prototype.auth = function (id, user, authkey) {
    this._authpacket = [id, user, authkey];

    // Two cases here: if we're already connected, with send the auth
    // packet immediately. Otherwise we wait for a `connected` event,
    // which won't be sent until after we re-authenticate.
    if (this.isConnected()) {
        return this.call('auth', [id, user, authkey]);
    }

    var self = this;
    return new BeamSocket.Promise(function (resolve) {
        self.once('authresult', resolve);
    });
};

/**
 * Runs a method on the socket. Returns a promise that is rejected or
 * resolved upon reply.
 * @access public
 * @param  {String} method
 * @param  {Array=[]} args_ Additional arguments to pass to the method.
 * @param  {Options={}} options_
 * @return {Promise}
 */
BeamSocket.prototype.call = function (method, args_, options_) {
    // Unpack arguments, so that the client can pass both, one, or
    // neither args or options.
    var options = options_;
    var args = args_;
    if (!Array.isArray(args)) {
        options = args;
        args = [];
    }
    options = options || {};

    // Send out the data
    var id = this._callNo++;
    var self = this;

    // This is created before we call and wait on .send purely for ease
    // of use in tests, so that we can mock an incoming packet synchronously.
    var replyPromise = new BeamSocket.Promise(function (resolve, reject) {
        self._replies[id] = new Reply(resolve, reject);
    });

    return this.send({
        type: 'method',
        method: method,
        arguments: args,
        id: id,
    }, options)
    .then(function () {
        // Then create and return a promise that's resolved when we get
        // a reply, if we expect one to be given.
        if (options.noReply) {
            return BeamSocket.Promise.resolve();
        }

        return race([
            timeout(options.timeout || self._callTimeout),
            replyPromise,
        ]);
    })
    .catch(function (err) {
        if (err instanceof TimeoutError) {
            delete self._replies[id];
        }
        throw err;
    });
};

/**
 * Closes the websocket gracefully.
 * @access public
 */
BeamSocket.prototype.close = function () {
    if (this.ws) {
        this.ws.close();
        this.status = BeamSocket.CLOSING;
    } else {
        clearTimeout(this._reconnectTimeout);
        this.status = BeamSocket.CLOSED;
    }
};

/**
 * Promise class to use for various operations on the socket. The only
 * requirement is that this be an A+ promise implementation. By default
 * we try to require Bluebird, but you can switch it out with your own.
 * @type {Promise}
 */
// eslint-disable-next-line global-require
try { BeamSocket.Promise = require('bluebird'); } catch (e) { /* ignore */ }

/**
 * List of available statuses.
 * @readonly
 * @enum {Number}
 */
[
    /** We've not tried connecting yet */
    'IDLE',
    /** We successfully connected */
    'CONNECTED',
    /** The socket was is closing gracefully. */
    'CLOSING',
    /** The socket was closed gracefully. */
    'CLOSED',
    /** We're currently trying to connect */
    'CONNECTING',
].forEach(function (status, i) {
    BeamSocket[status] = i;
});

/**
 * Reference to the TimeoutError class.
 * @type {TimeoutError}
 */
BeamSocket.TimeoutError = TimeoutError;

module.exports = BeamSocket;
