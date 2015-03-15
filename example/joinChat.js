var Beam = require('../');
var Password = require('../lib/providers/password');
var ChatService = require('../lib/services/chat');

var username = 'Sibyl53';
var password = 'password';
var channel = 2;


var beam = new Beam();
beam.setUrl('http://localhost:1337/api/v1');
beam.auth(new Password(username, password)).then(function () {
    console.log('user ' + beam.getUser().id + ' authed successfully...');
    return beam.use(ChatService).join(channel);
}).then(function (res) {
    console.log('join chat', res);
});
