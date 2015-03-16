var util = require('util');
var events = require('events');
var Bluebird = require('bluebird');

var Reply = require('./reply');
var errors = require('../errors');
var factory = require('./factory');

/**
 * Manages a connect to Beam's chat servers.
 * @access public
 * @param {Array} addresses
 */
function BeamSocket (addresses) {
    events.EventEmitter.call(this);

    // Which connection we use in our load balancing.
    this.addressOffset = Math.floor(Math.random() * addresses.length) - 1;

    // List of addresses we can connect to.
    this.addresses = addresses;

    // Spool to store events queued when the connection is lost.
    this.spool = [];

    // The WebSocket instance we're currently connected with.
    this.ws = null;

    // The status of the socket connection.
    this.status = BeamSocket.IDLE;

    // Number of retries to do before we give up connecting.
    this.retries = 0;
    // Max number of retries to do.
    this.maxRetries = 5;
    // Wait duration between retries.
    this.retryDelay = 500;

    // Map of call IDs to promises that should be resolved on
    // method responses.
    this.replies = {};

    // Authentication packet store that we'll resend if we have to reconnect.
    this.authpacket = null;

    // Counter for method calls.
    this.callNo = 0;
}

util.inherits(BeamSocket, events.EventEmitter);

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
    if (++this.addressOffset >= this.addresses.length) {
        this.addressOffset = 0;
    }

    return this.addresses[this.addressOffset];
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

    // Websocket connection has been established.
    ws.on('open', this.unspool.bind(this));

    // We got an incoming data packet.
    ws.on('message', this.parsePacket.bind(this));

    // Websocket connection closed
    ws.on('close', function () {
        self.emit('closed');

        // If we errored, we are already trying to reconnect, don't
        // change the BeamSocket.
        if (self.status !== BeamSocket.CONNECTING) {
            self.status = BeamSocket.CLOSED;
        }

        // Let v8 clean up after itself.
        ws = null;
        self = null;
    });

    // Websocket hit an error and is about to close.
    ws.on('error', function (err) {
        self.emit('error', err);

        // Check to see if we should reconnect.
        if (self.retries++ < self.maxRetries) {
            // Set the status and retry booting after a bit.
            self.status = BeamSocket.CONNECTING;
            setTimeout(self.boot.bind(self), 500);

            // Terminate the socket to make sure it closes.
            ws.terminate();
        } else {
            self.status = ABORTED;
        }
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
    if (this.authpacket) {
        this.call('auth', this.authpacket, { force: true })
            .then(bang)
            .catch(function () {
                self.emit('error', new errors.AuthenticationFailedError());
                self.close();
            });
    }
    // Otherwise, we can reestablish immedately
    else {
        bang();
    }

    // Helper function that's called when we're fully reestablished and
    // ready to take direct calls again.
    function bang () {
        // Send any spooled events that we have.
        for (var i = 0; i < self.spool.length; i++) {
            self.send(self.spool[i], { force: true });
        }
        self.spool = [];

        // Finally, tell the world we're connected.
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
            var reply = this.replies[packet.id];
            if (typeof reply !== 'undefined') {
                reply.handle(packet);
                delete this.replies[packet.id];
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
    } else {
        this.spool.push(data);
        this.emit('spooled', data);
    }
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

    // Save the arguments to any auth call we get.
    if (method === 'auth') {
        this.authpacket = args;
    }

    // Send out the data
    var id = this.callNo++, self = this;
    this.send({ type: 'method', method: method, arguments: args, id: id }, options);


    // Then create and return a promise that's resolved when we get
    // a reply, if we expect one to be given.
    if (!options.noReply) {
        return new Bluebird(function (resolve, reject) {
            self.replies[id] = new Reply(resolve, reject);
        }).timeout(5000)
          .catch(Bluebird.TimeoutError, function () {
            // After five seconds, if we haven't gotten a reply, remove
            // the method reply. Keeps memory leaks down.
            delete self.replies[id];
          })
          .finally(function () {
            // null to prevent memory leaks
            id = null;
            self = null;
          });
    }
};

/**
 * Closes the existing websocket.
 * @access public
 */
BeamSocket.prototype.close = function () {
    if (this.ws) {
        this.ws.close();
    }
};

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
    /** The socket was closed gracefully. */
    'CLOSED',
    /** We're currently trying to connect */
    'CONNECTING',
    /** We tried several times to connect, but were unable to do so. */
    'ABORTED',
].forEach(function (status, i) {
    BeamSocket[status] = i;
});

module.exports = BeamSocket;
