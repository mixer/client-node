var Beam = require('../');
var ChatService = require('../src/services/chat');

var express = require('express');
var app = express();


/**
 * Returns a client set up to use OAuth.
 * @return {Client}
 */
function getClient() {
    var client = new Beam();

    client.use('oauth', {
        clientId: 'your-client-id',
        secret: 'your-optional-secret-key',
    });

    return client;
}

/**
 * Returns the URL you're directing people to after they finish
 * OAuth. Right now this is set to the `/returned` route.
 * @return {String}
 */
function getRedirectUri() {
    return 'http://mysite.com:3000/returned';
}

/**
 * Users going to the index page are redirected to the main
 * Beam site to give authorization for you to connect to chat.
 */
app.get('/', (req, res) => {
    var url = getClient().getProvider().getRedirect(
            getRedirectUri(), ['chat:connect']);

    res.redirect(url);
});

/**
 * They come back to the `/returned` endpoint. Auth them, then
 * you can do whatever you'd like.
 */
app.get('/returned', (req, res) => {
    var client = getClient();
    var oauth = client.getProvider();

    oauth.attempt(getRedirectUri(), req.query)
    .then(() => new ChatService(client).join(1))
        // you're authenticated!
    .then(result => {
        res.send(JSON.stringify(result));
    })
    .catch(err => {
        console.log('error authenticating:', err);
    });
});

app.listen(3000);
