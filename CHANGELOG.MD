1.0.0
 - Port to typescript.
   - The entire package structure changed but most of the APIs are still the same.
   - It's strongly adviced the consome this client via Typescript now.


0.4.0
 - **API/Breaking**: prefix 'private' members with an underscore
 - **Breaking**: Include a dedicated auth method and fix issues with authentication. Previously there were some issues, such as the promise never resolving if you called auth before the socket connected even though we supposedly spooled the reply. I include this as breaking since using `.call('auth', ` will no longer save those credentials to be reused on reconnect
 - **Breaking:** drop support for 0.12 (in our dependencies)
 - **Breaking:** on the chat server we now reply to _every_ method we get, so after a timeout we throw an error on the socket (where previously the promise returned from .call() would resolve to undefined) if we don't get a reply. The error class is exposed as `Socket.TimeoutError`.
 - Add compatibility with browser-based sockets
 - Fix bias in round-robining
 - Use a backoff for chat reconnection
 - Use a generic A+ promise on Socket.Promise so it can be swapped out by consumers (replacing with rsvp on our frontend)
 - Add unit tests where they were previously skimpy
 - Fix an issue with the socket re-opening if it was closed after a connection failure
