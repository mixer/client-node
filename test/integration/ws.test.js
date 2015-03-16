var expect = require('chai').expect;

describe('websocket', function () {
    var BeamSocket = require('../../lib/ws');
    var Client = require('../../');
    var Password = require('../../lib/providers/password');
    var ChatService = require('../../lib/services/chat');
    var socket, body;

    beforeEach(function (done) {
        var client = new Client();
        client.setUrl('http://localhost:1337/api/v1');
        client.auth(new Password('Sibyl53', 'password')).then(function () {
            return client.use(ChatService).join(2);
        }).then(function (res) {
            socket = new BeamSocket(res.body.endpoints);
            body = res.body;
            socket.boot();
            done();
        }).catch(done);
    });

    afterEach(function () {
        socket.close();
    });

    it('authenticates with chat', function (done) {
        socket.call('auth', [2, 2, body.authkey]).then(function (data) {
            expect(data).to.deep.equal({ authenticated: true, role: 'Owner' });
            done();
        }).catch(done);
    });
});
