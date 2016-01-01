var expect = require('chai').expect;

describe('beam client', function () {
    var request = require('../../lib/request');

    it('builds urls correctly', function () {
        expect(this.client.buildAddress('https://beam.pro/', '/foo/bar')).to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro/', 'foo/bar')).to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', '/foo/bar')).to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', 'foo/bar')).to.equal('https://beam.pro/foo/bar');
    });

    it('sets the url', function () {
        expect(this.client.setUrl('api', 'http://example.com'));
        expect(this.client.urls.api).to.equal('http://example.com');
    });

    it('makes a request successfully', function (done) {
        this.response.a = 'b';

        this.client.request('get', '/users/current', { a: 'b' }).bind(this).then(function (res) {
            expect(this.request).to.deep.equal({
                a: 'b',
                method: 'get',
                url: 'https://beam.pro/api/v1/users/current'
            });
            expect(res).to.deep.equal(this.response);
            done();
        });
    });

    it('parses json results', function (done) {
        this.response.body = '{"foo":"bar"}';

        this.client.request('get', '/users/current', { a: 'b' }).bind(this).then(function (res) {
            expect(res.body).to.deep.equal({ foo: "bar" });
            done();
        });
    });

    it('makes a request with errors', function (done) {
        request.run = function (d, cb) { data = d; cb(new Error('oh no!')); };
        this.client.request('get', '/users/current', { a: 'b' }).catch(function (e) {
            expect(e.message).to.equal('oh no!');
            done();
        });
    });

    it('creates and uses a provider', function () {
        var creds = { username: 'connor', password: 'password' };
        var p = this.client.use('password', creds);
        expect(p.auth).to.deep.equal(creds);
        expect(this.client.getProvider()).to.equal(p);
    });

    it('exposes services eagerly', function () {
        expect(this.client.chat).to.be.an.instanceof(require('../../lib/services/chat'));
        expect(this.client.chat.join).to.be.a('function');
    });
});
