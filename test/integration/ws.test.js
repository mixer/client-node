'use strict'

const { expect } = require('chai');

describe('websocket', () => {
    const { Socket, Client, ChatService, OAuthProvider, DefaultRequestRunner } = require('../../src');
    const WebSocket = require('ws');
    let socket;
    let body;

    beforeEach(() => {
        const client = new Client(new DefaultRequestRunner());
        client.setUrl('http://localhost:1337/api/v1');
        // TODO: Fix this!
        client.use(new OAuthProvider(client, {
            clientId: 'dummy',
            secret: 'dummy',
            tokens: {
                access: 'dummy',
                refresh: 'dummy',
                expires: '2017-04-27T18:07:01.982Z',
            },
        }))
        return new ChatService(client).join(2)
        .then(res => {
            socket = new Socket(WebSocket, res.body.endpoints);
            body = res.body;
            socket.boot();
        });
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
