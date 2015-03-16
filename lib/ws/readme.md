# Beam Websocket

This is a (the?) official reference for implementing the Beam websocket. It's made to be user-friendly, very high performant, and stable. Events are implemented using the standard EventEmitter and "method" calls are done like any other promise-based Node.js library.

Your usage may look something like this:

```js
// Require the socket
var BeamSocket = require('beam/lib/ws');
// Some function that gets the JSON response from `GET /chats/:id`.
var data = getDataFromChannelJoinEndpoint();

var socket = new BeamSocket(data.endpoints).boot();

socket.call('auth', channel.id, user.id, data.authkey)
    .then(function () {
        console.log('You are now authenticated!');
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

### socket.boot()

Starts up the client; attempts to connect to the server.

### socket.call(method[, args...])

Calls a chat "method" (string) with the set of arguments. It returns a [Bluebird](https://github.com/petkaantonov/bluebird) promise that's resolved to the packet data on success, or rejected with an error string on failure.

### Event: 'connected'

Called when a connection to the chat server is established. This might be fired multiple times per instance; in the event of a chat server going down, we automatically fail over to the next server. Three notes:

 * You don't need to re-send the "auth" packet after the first connection. We'll do that automatically for you!
 * You can still "call" methods while the socket is down. We'll spool them and send them as soon as we're connected again.
 * If we can't authenticate on reconnect, we'll emit an `error` event with an AuthenticationFailedError.

### Event: 'closed'

Fired when the socket connection closes.

### Event: 'error'

Fired when an error happens; we can't parse a packet, or we get a reply to a packet that we didn't expect. Currently there are no big fatal unrecoverable errors sent here, but you should log it for your own inforation.
