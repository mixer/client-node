var Beam = require('../');
var ChatService = require('../lib/services/chat');

var channel = 2;
var beam = new Beam();

beam.use('password', {
    username: 'connor',
    password: 'password'
}).attempt().then(function () {
    return beam.join(channel);
}).then(function (res) {
    console.log('join chat response:', res);
}).catch(function (err) {
    console.log('error joining chat:', err);
});
