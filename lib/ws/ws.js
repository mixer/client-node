var util = require('util');
var events = require('events');

var Reply = require('./reply');
var errors = require('../errors');
var factory = require('./factory');

// The method of the authentication packet to store.
var authMethod = 'auth';

/**
 * Manages a connect to Beam's chat servers.
 * @access public
 * @param {Array} addresses
 */
function BeamSocket (addresses) {
    events.EventEmitter.call(this);

    // Which connection we use in our load balancing.
    this._addressOffset = Math.floor(Math.random() * addresses.length);

    // List of addresses we can connect to.
    this._addresses = addresses;

    // Spool to store events queued when the connection is lost.
    this._spool = [];

    // The WebSocket instance we're currently connected with.
    this.ws = null;

    // The status of the socket connection.
    this.status = BeamSocket.IDLE;

    // Counter of the current number of reconnect retries, and the number of
    // retries before we reset our reconnect attempts.
    this._retries = 0;
    this._retryWrap = 7; // max 2 minute retry time
    // Wait duration between retries.
    this.retryDelay = 500;
    // Timeout waiting to reconnect
    this._reconnectTimeout = null;

    // Number of milliseconds to wait in .call() before we give up waiting
    // for the reply. Used to prevent leakages.
    this.callTimeout = 1000 * 60;

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
    this.ws = null;
    if (this.status === BeamSocket.CLOSING) {
        this.status = BeamSocket.CLOSED;
        return this.emit('closed');
    }

    this.status = BeamSocket.CONNECTING;
    this._reconnectTimeout = setTimeout(
        this.boot.bind(this),
        this._getNextReconnectInterval()
    );
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
        self.unspool.apply(self, arguments);
    });

    // We got an incoming data packet.
    ws.on('message', function () {
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
    }
    // Otherwise, we can reestablish immediately
    else {
        bang();
    }

    // Helper function that's called when we're fully reestablished and
    // ready to take direct calls again.
    function bang () {
        // Send any spooled events that we have.
        for (var i = 0; i < self._spool.length; i++) {
            self.send(self._spool[i], { force: true });
        }
        self._spool = [];

        // Finally, tell the world we're connected.
        self._retries = 0;
        self.status = BeamSocket.CONNECTED;
        self.emit('connected');

        // Clean up for gc
        self = null;
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
        return this.emit('error', new errors.BadMessageError('Cannot parse binary packets. Wat.'));
    }

    // Unpack the packet data.
    var packet;
    try {
        packet = JSON.parse(data);
    } catch (e) {
        return this.emit('error', new errors.BadMessageError('Unable to parse packet as json'));
    }

    this.emit('packet', packet);

    switch (packet.type) {

        case 'reply':
            // Try to look up the packet reply handler, and call it if we can.
            var reply = this._replies[packet.id];
            if (typeof reply !== 'undefined') {
                reply.handle(packet);
                delete this._replies[packet.id];
            }
            // Otherwise emit an error. This might happen occasionally,
            // but failing silently is lame.
            else {
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
 * @fires BeamSocket#sent
 * @fires BeamSocket#spooled
 */
BeamSocket.prototype.send = function (data, options_) {
    var options = options_ || {};

    if (this.isConnected() || options.force) {
        this.ws.send(JSON.stringify(data));
        this.emit('sent', data);
    } else if (data.method !== authMethod) {
        this._spool.push(data);
        this.emit('spooled', data);
    }
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
    var options = options_, args = args_;
    if (!Array.isArray(args)) {
        options = args;
        args = [];
    }
    options = options || {};

    // Send out the data
    var id = this._callNo++, self = this;
    this.send({ type: 'method', method: method, arguments: args, id: id }, options);


    // Then create and return a promise that's resolved when we get
    // a reply, if we expect one to be given.
    if (options.noReply) {
        return;
    }

    var timeout;
    return new BeamSocket.Promise(function (resolve, reject) {
        timeout = setTimeout(function () {
            reject(new TimeoutError());
        }, self.callTimeout);

        self._replies[id] = new Reply(resolve, reject);
    }).catch(function (err) {
        // After five seconds, if we haven't gotten a reply, remove
        // the method reply. Keeps memory leaks down.
        if (err instanceof TimeoutError) {
            delete self._replies[id];
        }
        throw err;
    }).finally(function () {
        clearTimeout(timeout);
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
 * Promise class to use in .call
 * @type {Promise}
 */
BeamSocket.Promise = require('bluebird');

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
    'CONNECTING'
].forEach(function (status, i) {
    BeamSocket[status] = i;
});

/**
 * A TimeoutError is thrown in call if we don't get a response from the
 * chat server within a certain interval.
 */
function TimeoutError() { Error.call(this); }
TimeoutError.prototype = Object.create(Error.prototype);

/**
 * Reference to the TimeoutError class.
 * @type {TimeoutError}
 */
BeamSocket.TimeoutError = TimeoutError;

module.exports = BeamSocket;
