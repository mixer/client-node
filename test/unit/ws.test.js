var Bluebird = require('bluebird');
var expect = require('chai').expect;
var sinon = require('sinon');
var events = require('events');

describe('websocket', () =>{
    var BeamSocket = require('../../lib/ws');
    var factory = require('../../lib/ws/factory');
    var errors = require('../../lib/errors');
    var socket;
    var raw;
    var factoryStub;
    var clock;

    // synchronous-ly resolving promise-like object for use in tests
    var resolveSync = {
        then: () =>fn) { return fn(); },
    };

    beforeEach(() =>{
        raw = new events.EventEmitter();
        raw.close = sinon.spy();
        raw.send = sinon.spy();

        factoryStub = sinon.stub(factory, 'create').returns(raw);

        clock = sinon.useFakeTimers();
        socket = new BeamSocket(['a', 'b']).boot();
    });

    afterEach(() =>{
        factoryStub.restore();
        clock.restore();
    });

    it('balances requests', () =>{
        var i;
        for (i = []; i.length < 5;) i.push(socket.getAddress());
        if (i[0] === 'a') i = i.slice(1);
        expect(i.slice(0, 4)).to.deep.equal(['b', 'a', 'b', 'a']);
    });

    it('gets status and connected correctly', () =>{
        socket = new BeamSocket(['a', 'b']);
        expect(socket.getStatus()).to.equal(BeamSocket.IDLE);
        expect(socket.isConnected()).to.be.false;
        socket.status = BeamSocket.CONNECTED;
        expect(socket.isConnected()).to.be.true;
    });

    it('connects successfully', () =>{
        var lastErr;
        socket.on('error', () =>err) { lastErr = err; });
        var parse = sinon.stub(socket, 'parsePacket');

        expect(socket.status).to.equal(BeamSocket.CONNECTING);

        raw.emit('open');
        socket.emit('WelcomeEvent');
        expect(socket.status).to.equal(BeamSocket.CONNECTED);

        raw.emit('message', 'asdf');
        expect(parse.calledWith('asdf')).to.be.true;

        var err = new Error('oh no!');
        raw.emit('error', err);
        expect(lastErr).to.equal(err);
        expect(raw.close.called).to.be.true;
        raw.emit('close');
        expect(socket.status).to.equal(BeamSocket.CONNECTING);
    });

    it('kills the connection if no WelcomeEvent is received', () =>{
        socket.on('error', () =>{});

        raw.emit('open');
        expect(socket.status).to.equal(BeamSocket.CONNECTING);
        clock.tick(5000);

        expect(raw.close).to.have.been.calledOnce;
    });

    it('times out manually if the socket connection doesn\'t complete in time', () =>{
        socket.on('error', () =>{});

        clock.tick(5000);

        expect(raw.close).to.have.been.calledOnce;
    });

    it('reconnects after an interval', () =>{
        socket.on('error', () =>{});

        expect(socket.status).to.equal(BeamSocket.CONNECTING);
        expect(factoryStub.callCount).to.equal(1);
        sinon.stub(socket, '_getNextReconnectInterval').returns(500);

        raw.emit('error');
        raw.emit('close');
        expect(raw.close.callCount).to.equal(1);

        // initially tries to reconnect after 500ms
        clock.tick(499);
        expect(factoryStub.callCount).to.equal(1);
        clock.tick(1);
        expect(factoryStub.callCount).to.equal(2);
        expect(socket._getNextReconnectInterval.called).to.be.true;
    });

    it('runs exponential backoff', () =>{
        expect(socket._getNextReconnectInterval()).to.be.oneOf([500, 1000]);
        expect(socket._getNextReconnectInterval()).to.be.oneOf([1000, 2000]);
        expect(socket._getNextReconnectInterval()).to.be.oneOf([2000, 4000]);
    });

    it('closes the websocket connection', () =>{
        socket.close();
        expect(raw.close.called).to.be.true;
        expect(socket.status).to.equal(BeamSocket.CLOSING);
        raw.emit('close');
        expect(socket.status).to.equal(BeamSocket.CLOSED);
    });

    it('cancels reconnection on close', () =>{
        socket.on('error', () =>{});

        expect(factoryStub.callCount).to.equal(1);
        raw.emit('error');
        raw.emit('close');
        socket.close();
        clock.tick(1000);
        expect(factoryStub.callCount).to.equal(1);
    });

    describe('sending', () =>{
        var data = { foo: 'bar' };

        it('sends events when connected', () =>done) {
            sinon.stub(socket, 'isConnected').returns(true);
            socket.on('sent', () =>subData) {
                expect(raw.send.calledWith('{"foo":"bar"}')).to.be.true;
                expect(subData).to.deep.equal(subData);
                done();
            });

            socket.send(data);
        });

        it('spools when not connected', () =>done) {
            sinon.stub(socket, 'isConnected').returns(false);
            socket.on('spooled', () =>subData) {
                expect(raw.send.called).to.be.false;
                expect(socket._spool).to.containSubset([{ data: subData }]);
                done();
            });

            socket.send(data);
        });

        it('sends events when not connected but forced', () =>done) {
            sinon.stub(socket, 'isConnected').returns(false);
            socket.on('sent', () =>subData) {
                expect(raw.send.calledWith('{"foo":"bar"}')).to.be.true;
                expect(data).to.deep.equal(subData);
                done();
            });

            socket.send(data, { force: true });
        });
    });

    describe('packet parsing', () =>{
        var evPacket = JSON.stringify({
            type: 'event',
            event: 'UserJoin',
            data: {
                username: 'connor4312',
                role: 'Owner',
                id: 146,
            },
        });
        var authPacket = JSON.stringify({
            type: 'reply',
            error: null,
            id: 1,
            data: {
                authenticated: true,
                role: 'Owner',
            },
        });

        it('fails to parse binary', () =>done) {
            socket.on('error', () =>err) {
                expect(err).to.be.an.instanceof(errors.BadMessageError);
                done();
            });
            socket.parsePacket(evPacket, { binary: true });
        });

        it('fails to parse invalid json', () =>done) {
            socket.on('error', () =>err) {
                expect(err).to.be.an.instanceof(errors.BadMessageError);
                done();
            });
            socket.parsePacket('lel', { binary: false });
        });

        it('fails to parse bad type', () =>done) {
            socket.on('error', () =>err) {
                expect(err).to.be.an.instanceof(errors.BadMessageError);
                done();
            });
            socket.parsePacket('{"type":"silly"}', { binary: false });
        });

        it('parses event correctly', () =>done) {
            socket.on('UserJoin', () =>data) {
                expect(data).to.deep.equal({ username: 'connor4312', role: 'Owner', id: 146 });
                done();
            });

            socket.parsePacket(evPacket, { binary: false });
        });

        it('throws error on replies with no handler', () =>done) {
            socket.on('error', () =>err) {
                expect(err).to.be.an.instanceof(errors.NoMethodHandlerError);
                done();
            });
            socket.parsePacket(authPacket, { binary: false });
        });

        it('passes replies to handlers and deletes handler', () =>{
            var spy = socket._replies[1] = { handle: sinon.spy() };
            socket.parsePacket(authPacket, { binary: false });
            expect(socket._replies[1]).to.be.undefined;
            expect(spy.handle.calledWith(JSON.parse(authPacket))).to.be.true;
        });
    });

    describe('unspooling', () =>{
        beforeEach(() =>{
            socket._spool = [
                { data: 'foo', resolve: () =>{} },
                { data: 'bar', resolve: () =>{} },
            ];
        });

        it('connects directly if no previous auth packet', () =>done) {
            socket.on('connected', () =>{
                expect(raw.send.calledWith('"foo"')).to.be.true;
                expect(raw.send.calledWith('"bar"')).to.be.true;
                expect(socket._spool.length).to.equal(0);
                expect(socket.isConnected()).to.be.true;
                done();
            });

            expect(socket.isConnected()).to.be.false;
            socket.unspool();
        });

        it('tries to auth successfully', () =>done) {
            var stub = sinon.stub(socket, 'call').returns(Bluebird.resolve());

            socket.on('connected', () =>{
                expect(socket.isConnected()).to.be.true;
                expect(stub.calledWith('auth', [1, 2, 3], { force: true })).to.be.true;
                done();
            });

            socket._authpacket = [1, 2, 3];
            socket.unspool();
        });

        it('tries to auth rejects unsuccessful', () =>done) {
            var stub = sinon.stub(socket, 'call').returns(Bluebird.reject());
            socket.on('error', () =>err) {
                expect(err).to.be.an.instanceof(errors.AuthenticationFailedError);
                done();
                stub.restore();
            });

            socket._authpacket = [1, 2, 3];
            socket.unspool();
        });
    });

    describe('auth packet', () =>{
        it('waits for connection before sending', () =>done) {
            var called = false;
            socket.auth(1, 2, 3).then(res => {
                called = true;
                expect(res).to.equal('ok');
                done();
            });

            expect(socket._authpacket).to.deep.equal([1, 2, 3]);
            expect(called).to.be.false;
            socket.emit('authresult', 'ok');
        });

        it('sends immediately otherwise', () =>{
            raw.emit('open');
            socket.emit('WelcomeEvent');

            sinon.stub(socket, 'call').returns('ok!');
            expect(socket.auth(1, 2, 3)).to.equal('ok!');
            expect(socket._authpacket).to.deep.equal([1, 2, 3]);
            expect(socket.call.calledWith('auth', [1, 2, 3])).to.be.true;
        });
    });

    describe('method calling', () =>{
        beforeEach(() =>{
            socket.status = BeamSocket.CONNECTED;
            sinon.stub(socket, 'send').returns(resolveSync);
        });

        it('sends basic with no reply or args', () =>{
            socket.call('foo', { noReply: true });
            expect(socket.send.calledWith(
                { type: 'method', method: 'foo', arguments: [], id: 0 }, { noReply: true }
            )).to.be.true;
        });

        it('increments the call ID', () =>{
            for (var i = 0; i < 10; i++) {
                socket.call('foo', { noReply: true });
                expect(socket.send.calledWith({
                    type: 'method',
                    method: 'foo',
                    arguments: [],
                    id: i,
                })).to.be.true;
            }
        });

        it('registers the reply with resolved response', () =>done) {
            socket.call('foo', [1, 2, 3]).then(data => {
                expect(data).to.deep.equal({ authenticated: true, role: 'Owner' });
                done();
            });

            socket.parsePacket(JSON.stringify({
                type: 'reply',
                error: null,
                id: 0,
                data: { authenticated: true, role: 'Owner' },
            }));
        });

        it('registers the reply with rejected response', () =>done) {
            socket.call('foo', [1, 2, 3]).catch(err => {
                expect(err).to.equal('foobar');
                done();
            });
            socket.parsePacket(JSON.stringify({
                type: 'reply',
                error: 'foobar',
                id: 0,
                data: null,
            }));
        });

        it('quietly removes the reply after a timeout', () =>done) {
            socket.call('foo', [1, 2, 3]).catch(err => {
                expect(err).to.be.an.instanceof(BeamSocket.TimeoutError);
                expect(socket._replies[0]).not.to.be.defined;
                done();
            });
            expect(socket._replies[0]).to.be.defined;
            clock.tick((1000 * 60) + 1);
        });

        it('measure timeout duration since the socket dispatch rather than .call', () =>{
            socket.send.restore();
            sinon.stub(socket, 'send').returns({
                then: () =>fn) {
                    clock.tick(1000 * 60);
                    socket.parsePacket(JSON.stringify({
                        type: 'reply',
                        error: null,
                        id: 0,
                        data: 'ok',
                    }));
                    return fn();
                },
            });

            return socket.call('foo', [1, 2, 3]).then(reply => {
                expect(reply).to.equal('ok');
            });
        });
    });

    describe('pings', () =>{
        beforeEach(() =>{
            raw.emit('open');
            socket.emit('WelcomeEvent');
            clock.tick((1000 * 15) - 1);
        });

        describe('node', () =>{
            beforeEach(() =>{
                raw.ping = sinon.spy();
            });

            it('should send a ping packet after an interval', () =>{
                expect(raw.ping).to.not.have.been.called;
                clock.tick(1);
                expect(raw.ping).to.have.been.called;
            });

            it('should error if no pong is received', () =>done) {
                socket.on('error', () =>err) {
                    expect(err).to.be.an.instanceof(BeamSocket.TimeoutError);
                    done();
                });

                clock.tick(5001);
            });

            it('should succeed if pong is received', () =>{
                socket.on('error', () =>err) {
                    throw err;
                });

                clock.tick(1);
                raw.emit('pong');
                clock.tick(5000);
            });

            it('should defer pings after incoming messages are received', () =>{
                raw.emit('message', '{"type":"event","event":"foo"}');
                expect(raw.ping).to.not.have.been.called;
                clock.tick(1000);
                expect(raw.ping).to.not.have.been.called;
                clock.tick(14000);
                expect(raw.ping).to.have.been.called;
            });
        });

        describe('browser', () =>{
            beforeEach(() =>{
                delete raw.ping;
                sinon.stub(socket, 'send').returns(resolveSync);
            });

            it('should send a ping packet after an interval', () =>{
                expect(socket.send).to.not.have.been.called;
                clock.tick(1);
                expect(socket.send).to.have.been.calledWith({
                    type: 'method',
                    method: 'ping',
                    arguments: [],
                    id: 0,
                });
            });

            it('should error if no pong is received', () =>done) {
                socket.on('error', () =>err) {
                    expect(err).to.be.an.instanceof(BeamSocket.TimeoutError);
                    done();
                });

                clock.tick(5001);
            });

            it('should succeed if pong is received', () =>{
                socket.send.returns(Bluebird.resolve());
                socket.on('error', () =>err) {
                    throw err;
                });

                clock.tick(1);
                clock.tick(5000);
            });
        });
    });
});
