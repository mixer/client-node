# Beam Websocket

This is a (the?) official reference for implementing the Beam websocket. It's made to be user-friendly, very high performant, and stable. Events are implemented using the standard EventEmitter and "method" calls are done like any other promise-based Node.js library.

You can read more about the chat server on our developers site: [https://developer.beam.pro/api/chatproto](https://developer.beam.pro/api/chatproto).

Your usage may look something like this:

```js
// Require the socket
var BeamSocket = require('beam/lib/ws');
// Some function that gets the JSON response from `GET /chats/:id`.
var data = getDataFromChannelJoinEndpoint();

var socket = new BeamSocket(data.endpoints).boot();

// You don't need to wait for the socket to connect before calling methods,
// we spool them and run them when connected automatically!
socket.auth(channel.id, user.id, data.authkey)
    .then(function () {
        console.log('You are now authenticated!');
        return socket.call('msg', ['Hello world!']);
    }).catch(function (err) {
        console.log('Oh no! An error occurred!')
    });

socket.on('ChatMessage', function (data) {
    console.log('We got a ChatMessage packet!');
    console.log(data);
});
```

## Class: BeamSocket

A basic websocket client. It's an EventEmitter.

### new BeamSocket(addresses)

Construct a new socket client, using the list of addresses returned from the `GET /chats/:id` endpoint. Behind the scenes we load balance and do failover for you. How nice!

### BeamSocket.{IDLE|CONNECTED|CLOSED|ABORTED}

Status constants for comparison with what you get from `.getStatus()`. Note that these are attached to the _class_, not the _prototype_.

### socket.boot()

Starts up the client; attempts to connect to the server.

### socket.getStatus()

Returns a status constant (as listed above). Should be compared like `socket.getStatus === BeamSocket.CONNECTED`.

### socket.isConnected()

Return whether the socket is currently connected.

### socket.auth(channel[, user, authkey])

Joins the chat of a certain channel by its ID. If you want to join anonymously (without being able to chat) you can omit the `user` and `authkey`. The `user` is the user ID you're authenticating as, the authkey is the alphanumeric token returns from `GET /api/v1/chats/:id`.

### socket.call(method, [args], [options])

Calls a chat "method" (string) with the array set of arguments. Options:

 * `noReply` (default false) will not listen for a reply. If you don't pass noReply, `.call()` will returnt a [Bluebird](https://github.com/petkaantonov/bluebird) promise that's resolved to the packet data on success, or rejected with an error string on failure.
 * `force` Mainly for internal use. Bypasses spooling and tries sending a method to the websocket regardless of state.

### socket.send(data)

A lower-level method. Directly sends, or spools, an object to be stringified and set over the socket.

### socket.close()

Gracefully closes the socket connection, if one exists. We won't attempt to reconnect after this is called.

### Event: 'connected'

Called when a connection to the chat server is established. This might be fired multiple times per instance; in the event of a chat server going down, we automatically fail over to the next server. Three notes:

 * You don't need to re-send the "auth" packet after the first connection. We'll do that automatically for you!
 * You can still "call" methods while the socket is down. We'll spool them and send them as soon as we're connected again.
 * If we can't authenticate on reconnect, we'll emit an `error` event with an AuthenticationFailedError.

### Event: 'closed'

Fired when the socket connection closes.

### Event: 'error(err)'

Fired when an error happens; we can't parse a packet, or we get a reply to a packet that we didn't expect. Currently there are no big fatal unrecoverable errors sent here, but you should log it for your own inforation.

### Event: 'packet(data)'

Fired whenever we get an incoming packet, after we parse the JSON and before we actually process it as an event or reply.

### Event: 'sent(data)'

Fired when we pass data over to the websocket to be sent to the server. This is different from the following event...

### Event: 'spooled(data)'

Fired when we tried to send data to the socket, but it wasn't connected yet. When the socket reconnects the data will be automatically be sent.
