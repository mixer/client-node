var expect = require('chai').expect;

describe('beam client', function () {
    var request = require('../../lib/request');

    it('builds urls correctly', function () {
        expect(this.client.buildAddress('/foo/bar')).to.equal('https://beam.pro/api/v1/foo/bar');
        expect(this.client.buildAddress('foo/bar')).to.equal('https://beam.pro/api/v1/foo/bar');
    });

    it('sets the url', function () {
        expect(this.client.setUrl('http://example.com'));
        expect(this.client.buildAddress('foo/bar')).to.equal('http://example.com/foo/bar');
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
});
