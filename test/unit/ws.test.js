'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const { EventEmitter } = require('events');

const CLIENT_ID = 'abc123';

describe('websocket', () => {
    const {
        AuthenticationFailedError,
        Socket,
        BadMessageError,
        TimeoutError,
        NoMethodHandlerError,
        UnknownCodeError,
    } = require('../../src');
    let socket;
    let raw;
    let factoryStub;
    let clock;
    let MockSocket;

    // synchronous-ly resolving promise-like object for use in tests
    // TODO: This is BAD!
    const resolveSync = {
        then: fn => {
            return fn() || resolveSync;
        },
        catch: () => {},
    };

    beforeEach(() => {
        factoryStub = sinon.spy();
        MockSocket = class MockSocket extends EventEmitter {
            constructor() {
                super();
                raw = this;
                factoryStub();
            }

            ping() {}
        };
        MockSocket.prototype.close = sinon.spy();
        MockSocket.prototype.send = sinon.spy();

        clock = sinon.useFakeTimers();
        socket = new Socket(MockSocket, ['a', 'b'], { clientId: CLIENT_ID }).boot();
    });

    afterEach(() => {
        clock.restore();
    });

    it('balances requests', () => {
        socket._addressOffset = 0;

        let i;
        for (i = []; i.length < 5; ) i.push(socket.getAddress());
        if (i[0] === 'a') i = i.slice(1);
        expect(i.slice(0, 4)).to.deep.equal([
            `b?version=1.0&Client-ID=${CLIENT_ID}`,
            `a?version=1.0&Client-ID=${CLIENT_ID}`,
            `b?version=1.0&Client-ID=${CLIENT_ID}`,
            `a?version=1.0&Client-ID=${CLIENT_ID}`,
        ]);
    });

    it('gets status and connected correctly', () => {
        socket = new Socket(MockSocket, ['a', 'b']);
        expect(socket.getStatus()).to.equal(Socket.IDLE);
        expect(socket.isConnected()).to.be.false;
        socket.status = Socket.CONNECTED;
        expect(socket.isConnected()).to.be.true;
    });

    it('connects successfully', done => {
        let lastErr;
        socket.on('error', err => {
            lastErr = err;
        });
        socket.on('connected', () => {
            expect(socket.status).to.equal(Socket.CONNECTED);

            raw.emit('message', 'asdf');
            expect(parse.calledWith('asdf')).to.be.true;

            const err = new Error('oh no!');
            raw.emit('error', err);
            expect(lastErr).to.equal(err);
            expect(raw.close.called).to.be.true;
            raw.emit('close');
            expect(socket.status).to.equal(Socket.CONNECTING);
            done();
        });
        const parse = sinon.stub(socket, 'parsePacket');

        expect(socket.status).to.equal(Socket.CONNECTING);

        raw.emit('open');
        socket.emit('WelcomeEvent');
    });

    it('includes client id if provided', () => {
        expect(socket.getAddress()).to.contain(`Client-ID=${CLIENT_ID}`);
    });

    it('does not include client id if not provided', () => {
        socket = new Socket(MockSocket, ['a', 'b'], {});
        expect(socket.getAddress()).to.not.contain('Client-ID');
    });

    it('kills the connection if no WelcomeEvent is received', () => {
        socket.on('error', () => {});

        raw.emit('open');
        expect(socket.status).to.equal(Socket.CONNECTING);
        clock.tick(5000);

        expect(raw.close).to.have.been.calledOnce;
    });

    it("times out manually if the socket connection doesn't complete in time", () => {
        socket.on('error', () => {});

        clock.tick(5000);

        expect(raw.close).to.have.been.calledOnce;
    });

    it('reconnects after an interval', function() {
        const reconnectStub = sinon.stub();
        socket.on('error', () => {});
        socket.on('reconnecting', reconnectStub);

        expect(socket.status).to.equal(Socket.CONNECTING);
        expect(factoryStub.callCount).to.equal(1);
        sinon.stub(socket, 'getNextReconnectInterval').returns(500);

        raw.emit('error');
        raw.emit('close');
        expect(raw.close.callCount).to.equal(1);
        expect(reconnectStub).to.have.been.calledWith({ interval: 500, socket: raw });

        // initially tries to reconnect after 500ms
        clock.tick(499);
        expect(factoryStub.callCount).to.equal(1);
        clock.tick(1);
        expect(factoryStub.callCount).to.equal(2);
        expect(socket.getNextReconnectInterval.called).to.be.true;
    });

    it('runs exponential backoff', () => {
        expect(socket.getNextReconnectInterval()).to.be.oneOf([500, 1000]);
        expect(socket.getNextReconnectInterval()).to.be.oneOf([1000, 2000]);
        expect(socket.getNextReconnectInterval()).to.be.oneOf([2000, 4000]);
    });

    it('closes the websocket connection', () => {
        socket.close();
        expect(raw.close.called).to.be.true;
        expect(socket.status).to.equal(Socket.CLOSING);
        raw.emit('close');
        expect(socket.status).to.equal(Socket.CLOSED);
    });

    it('cancels reconnection on close', () => {
        socket.on('error', () => {});

        expect(factoryStub.callCount).to.equal(1);
        raw.emit('error');
        raw.emit('close');
        socket.close();
        clock.tick(1000);
        expect(factoryStub.callCount).to.equal(1);
    });

    describe('sending', () => {
        const data = { foo: 'bar' };

        it('sends events when connected', done => {
            sinon.stub(socket, 'isConnected').returns(true);
            socket.on('sent', subData => {
                expect(raw.send.calledWith('{"foo":"bar"}')).to.be.true;
                expect(subData).to.deep.equal(subData);
                done();
            });

            socket.send(data);
        });

        it('spools when not connected', done => {
            sinon.stub(socket, 'isConnected').returns(false);
            socket.on('spooled', subData => {
                expect(raw.send.called).to.be.false;
                expect(socket._spool).to.containSubset([{ data: subData }]);
                done();
            });

            socket.send(data);
        });

        it('sends events when not connected but forced', done => {
            sinon.stub(socket, 'isConnected').returns(false);
            socket.on('sent', subData => {
                expect(raw.send.calledWith('{"foo":"bar"}')).to.be.true;
                expect(data).to.deep.equal(subData);
                done();
            });

            socket.send(data, { force: true });
        });
    });

    describe('packet parsing', () => {
        const evPacket = JSON.stringify({
            type: 'event',
            event: 'UserJoin',
            data: {
                username: 'connor4312',
                role: 'Owner',
                id: 146,
            },
        });
        const authPacket = JSON.stringify({
            type: 'reply',
            error: null,
            id: 1,
            data: {
                authenticated: true,
                role: 'Owner',
            },
        });

        it('fails to parse binary', done => {
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(BadMessageError);
                done();
            });
            socket.parsePacket(evPacket, { binary: true });
        });

        it('fails to parse invalid json', done => {
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(BadMessageError);
                done();
            });
            socket.parsePacket('lel', { binary: false });
        });

        it('fails to parse bad type', done => {
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(BadMessageError);
                done();
            });
            socket.parsePacket('{"type":"silly"}', { binary: false });
        });

        it('parses event correctly', done => {
            socket.on('UserJoin', data => {
                expect(data).to.deep.equal({ username: 'connor4312', role: 'Owner', id: 146 });
                done();
            });

            socket.parsePacket(evPacket, { binary: false });
        });

        it('throws error on replies with no handler', done => {
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(NoMethodHandlerError);
                done();
            });
            socket.parsePacket(authPacket, { binary: false });
        });

        it('passes replies to handlers and deletes handler', () => {
            const spy = (socket._replies[1] = { handle: sinon.spy() });
            socket.parsePacket(authPacket, { binary: false });
            expect(socket._replies[1]).to.be.undefined;
            expect(spy.handle.calledWith(JSON.parse(authPacket))).to.be.true;
        });
    });

    describe('unspooling', () => {
        beforeEach(() => {
            socket._spool = [
                { data: 'foo', resolve: () => {} },
                { data: 'bar', resolve: () => {} },
            ];
        });

        it('connects directly if no previous auth packet and no optOutEvents', done => {
            socket.on('connected', () => {
                expect(raw.send.calledWith('"foo"')).to.be.true;
                expect(raw.send.calledWith('"bar"')).to.be.true;
                expect(socket._spool.length).to.equal(0);
                expect(socket.isConnected()).to.be.true;
                done();
            });

            expect(socket.isConnected()).to.be.false;
            socket.unspool();
        });

        it('tries to auth successfully', done => {
            const stub = sinon.stub(socket, 'call').resolves();

            socket.on('connected', () => {
                expect(socket.isConnected()).to.be.true;
                expect(stub.calledWith('auth', [1, 2, 3], { force: true })).to.be.true;
                done();
            });

            socket._authpacket = [1, 2, 3];
            socket.unspool();
        });

        it('tries to optOut of events successfully', done => {
            const stub = sinon.stub(socket, 'call').resolves();

            socket.on('connected', () => {
                expect(socket.isConnected()).to.be.true;
                expect(stub.calledWith('optOutEvents', ['UserJoin', 'UserLeave'], { force: true }))
                    .to.be.true;
                done();
            });

            socket._optOutEventsArgs = ['UserJoin', 'UserLeave'];
            socket.unspool();
        });

        it('tries to auth rejects unsuccessful', done => {
            const stub = sinon.stub(socket, 'call').rejects();
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(AuthenticationFailedError);
                done();
                stub.restore();
            });

            socket._authpacket = [1, 2, 3];
            socket.unspool();
        });

        it('tries to optOutEvents rejects unsuccessful', done => {
            const stub = sinon.stub(socket, 'call').rejects();
            socket.on('error', err => {
                expect(err).to.be.an.instanceof(UnknownCodeError);
                done();
                stub.restore();
            });

            socket._optOutEventsArgs = ['UserJoin', 'UserLeave'];
            socket.unspool();
        });

        it('tries to optOutEvents resolves successfully with no events to opt out from', done => {
            const stub = sinon.stub(socket, 'call');

            socket.on('connected', () => {
                expect(socket.isConnected()).to.be.true;
                expect(stub.notCalled).to.be.true;
                done();
            });

            socket._optOutEventsArgs = [];
            socket.unspool();
        });
    });

    describe('auth packet', () => {
        it('waits for connection before sending', done => {
            let called = false;
            socket.auth(1, 2, 3).then(res => {
                called = true;
                expect(res).to.equal('ok');
                done();
            });

            expect(socket._authpacket).to.deep.equal([1, 2, 3, undefined]);
            expect(called).to.be.false;
            socket.emit('authresult', 'ok');
        });

        it('sends immediately otherwise', () => {
            socket.on('connected', async () => {
                sinon.stub(socket, 'call').resolves('ok!');
                expect(await socket.auth(1, 2, 3)).to.equal('ok!');
                expect(socket._authpacket).to.deep.equal([1, 2, 3, undefined]);
                expect(socket.call.calledWith('auth', [1, 2, 3, undefined])).to.be.true;
            });
            raw.emit('open');
            socket.emit('WelcomeEvent');
        });

        it('passes through the access key', () => {
            socket.on('connected', async () => {
                sinon.stub(socket, 'call').resolves('ok!');
                expect(await socket.auth(1, 2, 3, 'heyo')).to.equal('ok!');
                expect(socket._authpacket).to.deep.equal([1, 2, 3, 'heyo']);
                expect(socket.call.calledWith('auth', [1, 2, 3, 'heyo'])).to.be.true;
            });
            raw.emit('open');
            socket.emit('WelcomeEvent');
        });

        it('disconnects and retries on AuthServerError', () => {
            socket.on('connected', async () => {
                sinon.stub(socket, 'call').rejects({ code: 4006 });
                try {
                    await socket.auth(1, 2, 3, 'heyo');
                } catch (err) {
                    expect(err).to.deep.equal({ code: 4006 });
                }
                expect(socket.status).to.equal(Socket.CONNECTING);
            });
            raw.emit('open');
            socket.emit('WelcomeEvent');
        });
    });

    describe('optOutEvents packet', () => {
        it('waits for connection before sending', done => {
            let called = false;
            socket.optOutEvents(['UserJoin', 'UserLeave']).then(res => {
                called = true;
                expect(res).to.equal(undefined);
                done();
            });

            expect(socket._optOutEventsArgs).to.deep.equal(['UserJoin', 'UserLeave']);
            expect(called).to.be.false;
            socket.emit('optOutResult');
        });

        it('sends immediately otherwise', () => {
            socket.on('connected', () => {
                sinon.stub(socket, 'call').returns('ok!');
                expect(socket.optOutEvents(['UserJoin', 'UserLeave'])).to.equal('ok!');
                expect(socket._optOutEventsArgs).to.deep.equal(['UserJoin', 'UserLeave']);
                expect(socket.call.calledWith('optOutEvents', ['UserJoin', 'UserLeave'])).to.be
                    .true;
            });
            raw.emit('open');
            socket.emit('WelcomeEvent');
        });
    });

    describe('method calling', () => {
        beforeEach(() => {
            socket.status = Socket.CONNECTED;
            sinon.stub(socket, 'send').returns(resolveSync);
        });

        it('sends basic with no reply or args', () => {
            socket.call('foo', [], { noReply: true });
            expect(socket.send).to.have.been.calledWith(
                {
                    type: 'method',
                    method: 'foo',
                    arguments: [],
                    id: 0,
                },
                { noReply: true },
            );
        });

        it('increments the call ID', () => {
            for (let i = 0; i < 10; i++) {
                socket.call('foo', [], { noReply: true });
                expect(socket.send).to.have.been.calledWith({
                    type: 'method',
                    method: 'foo',
                    arguments: [],
                    id: i,
                });
            }
        });

        it('registers the reply with resolved response', done => {
            socket.call('foo', [1, 2, 3]).then(data => {
                expect(data).to.deep.equal({ authenticated: true, role: 'Owner' });
                done();
            });

            socket.parsePacket(
                JSON.stringify({
                    type: 'reply',
                    error: null,
                    id: 0,
                    data: { authenticated: true, role: 'Owner' },
                }),
            );
        });

        it('registers the reply with rejected response', done => {
            socket.call('foo', [1, 2, 3]).catch(err => {
                expect(err).to.equal('foobar');
                done();
            });
            socket.parsePacket(
                JSON.stringify({
                    type: 'reply',
                    error: 'foobar',
                    id: 0,
                    data: null,
                }),
            );
        });

        it('quietly removes the reply after a timeout', done => {
            socket.call('foo', [1, 2, 3]).catch(err => {
                expect(err).to.be.an.instanceof(TimeoutError);
                expect(socket._replies[0]).not.to.be.defined;
                done();
            });
            expect(socket._replies[0]).to.be.defined;
            clock.tick(1000 * 60 + 1);
        });

        it('measure timeout duration since the socket dispatch rather than .call', () => {
            socket.send.restore();
            sinon.stub(socket, 'send').returns({
                then: fn => {
                    clock.tick(1000 * 60);
                    socket.parsePacket(
                        JSON.stringify({
                            type: 'reply',
                            error: null,
                            id: 0,
                            data: 'ok',
                        }),
                    );
                    return fn();
                },
                catch: () => {},
            });

            return socket.call('foo', [1, 2, 3]).then(reply => {
                expect(reply).to.equal('ok');
            });
        });
    });

    describe('pings', () => {
        beforeEach(() => {
            raw.emit('open');
            socket.emit('WelcomeEvent');
            clock.tick(1000 * 15 - 1);
        });

        describe('node', () => {
            beforeEach(() => {
                raw.ping = sinon.spy();
            });

            it('should send a ping packet after an interval', () => {
                expect(raw.ping).to.not.have.been.called;
                clock.tick(1);
                expect(raw.ping).to.have.been.called;
            });

            it('should error if no pong is received', done => {
                socket.on('error', err => {
                    expect(err).to.be.an.instanceof(TimeoutError);
                    done();
                });

                clock.tick(5001);
            });

            it('should succeed if pong is received', () => {
                socket.on('error', err => {
                    throw err;
                });

                clock.tick(1);
                raw.emit('pong');
                clock.tick(5000);
            });

            it('should defer pings after incoming messages are received', () => {
                raw.emit('message', '{"type":"event","event":"foo"}');
                expect(raw.ping).to.not.have.been.called;
                clock.tick(1000);
                expect(raw.ping).to.not.have.been.called;
                clock.tick(14000);
                expect(raw.ping).to.have.been.called;
            });
        });

        describe('browser', () => {
            beforeEach(() => {
                raw.ping = undefined;
                sinon.stub(socket, 'send').returns(resolveSync);
            });

            it('should send a ping packet after an interval', () => {
                expect(socket.send).to.not.have.been.called;
                clock.tick(1);
                expect(socket.send).to.have.been.calledWith({
                    type: 'method',
                    method: 'ping',
                    arguments: [],
                    id: 0,
                });
            });

            it('should error if no pong is received', done => {
                socket.on('error', err => {
                    expect(err).to.be.an.instanceof(TimeoutError);
                    done();
                });

                clock.tick(5001);
            });

            it('should succeed if pong is received', () => {
                socket.send.resolves();
                socket.on('error', err => {
                    throw err;
                });

                clock.tick(1);
                clock.tick(5000);
            });
        });
    });
});
