
0.4.0
 - **API/Breaking**: prefix 'private' members with an underscore
 - **Breaking**: Include a dedicated auth method and fix issues with authentication. Previously there were some issues, such as the promise never resolving if you called auth before the socket connected even though we supposedly spooled the reply. I include this as breaking since using `.call('auth', ` will no longer save those credentials to be reused on reconnect
 - **Breaking:** drop support for 0.12 (in our dependencies)
 - **Breaking:** on the chat server we now reply to _every_ method we get, so after a timeout we throw an error on the socket (where previously the promise returned from .call() would resolve to undefined) if we don't get a reply. The error class is exposed as `BeamSocket.TimeoutError`.
 - Add compatibility with browser-based sockets
 - Fix bias in round-robining
 - Use a backoff for chat reconnection
 - Use a generic A+ promise on BeamSocket.Promise so it can be swapped out by consumers (replacing with rsvp on our frontend)
 - Add unit tests where they were previously skimpy
 - Fix an issue with the socket re-opening if it was closed after a connection failure
