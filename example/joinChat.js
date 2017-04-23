const { Client, PasswordProvider } = require('beam-client-node');

const channel = 2;
const beam = new Client();
beam.user(new PasswordProvider(beam, {
    username: 'connor',
    password: 'password',
}))

beam.use('password', {
    username: 'connor',
    password: 'password',
})
.attempt()
.then(() => beam.chat.join(channel))
.then(res => {
    console.log('join chat response:', res);
})
.catch(err => {
    console.log('error joining chat:', err);
});
