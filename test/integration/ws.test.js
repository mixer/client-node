'use strict'

const { expect } = require('chai');

describe('websocket', () => {
    const { BeamSocket } = require('../../src/ws/BeamSocket');
    const { Client } = require('../../src/Client');
    const Password = require('../../src/providers/password');
    const ChatService = require('../../src/services/chat');
    let socket;
    let body;

    beforeEach(() => {
        const client = new Client();
        client.setUrl('http://localhost:1337/api/v1');
        return client.auth(new Password('Sibyl53', 'password'))
        .then(() => client.use(ChatService).join(2))
        .then(res => {
            socket = new BeamSocket(res.body.endpoints);
            body = res.body;
            socket.boot();
        })
    });

    afterEach(() => {
        socket.close();
    });

    it('authenticates with chat', () => {
        return socket.call('auth', [2, 2, body.authkey])
        .then(data => {
            expect(data).to.deep.equal({ authenticated: true, role: 'Owner' });
        });
    });
});
