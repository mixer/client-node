var Beam = require('../');

var channel = 2;
var beam = new Beam();

beam.use('password', {
    username: 'connor',
    password: 'password',
})
.attempt().then(() => beam.chat.join(channel))
.then(res => {
    console.log('join chat response:', res);
})
.catch(err => {
    console.log('error joining chat:', err);
});
