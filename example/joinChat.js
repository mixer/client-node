const { Client, OAuthProvider } = require('beam-client-node');

const channel = 2;
const beam = new Client();
beam.use(new OAuthProvider(beam, {
    clientId: 'your-client-id',
    secret: 'your-optional-secret-key',
}))
.attempt()
.then(() => beam.chat.join(channel))
.then(res => {
    console.log('join chat response:', res);
})
.catch(err => {
    console.log('error joining chat:', err);
});
