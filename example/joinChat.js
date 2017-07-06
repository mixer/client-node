const { Client, OAuthProvider, DefaultRequestRunner } = require('beam-client-node');

const channel = 2;
const client = new Client(new DefaultRequestRunner());
client.use(new OAuthProvider(client, {
    clientId: 'your-client-id',
    secret: 'your-optional-secret-key',
}))
.attempt()
.then(() => client.chat.join(channel))
.then(res => {
    console.log('join chat response:', res);
})
.catch(err => {
    console.log('error joining chat:', err);
});
