var expect = require('chai').expect;

describe('beam client', () =>{
    var request = require('../../lib/request');

    it('builds urls correctly', () =>{
        expect(this.client.buildAddress('https://beam.pro/', '/foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro/', 'foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', '/foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', 'foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
    });

    it('sets the url', () =>{
        expect(this.client.setUrl('api', 'http://example.com'));
        expect(this.client.urls.api).to.equal('http://example.com');
    });

    it('makes a request successfully', () =>{
        this.response.a = 'b';

        return this.client.request('get', '/users/current', { a: 'b' })
        .bind(this)
        .then(res => {
            expect(this.request).to.containSubset({
                a: 'b',
                method: 'get',
                url: 'https://beam.pro/api/v1/users/current',
            });
            expect(this.request.headers['User-Agent'])
            // eslint-disable-next-line no-useless-escape
            .to.match(/^BeamClient\/[0-9\.]+(\-beta\.\d)? \(JavaScript; Node\.js v[0-9\.]+\)$/);
            expect(res).to.deep.equal(this.response);
        });
    });

    it('parses json results', () => {
        this.response.body = { foo: 'bar' };

        return this.client.request('get', '/users/current', { a: 'b' })
        .then(res => {
            expect(res.body).to.deep.equal({ foo: 'bar' });
        });
    });

    it('makes a request with errors', () =>{
        request.run = () =>d, cb) {
            cb(new Error('oh no!'));
        };
        return this.client.request('get', '/users/current', { a: 'b' })
        .catch(e => {
            expect(e.message).to.equal('oh no!');
        });
    });

    it('creates and uses a provider', () =>{
        var creds = { username: 'connor', password: 'password' };
        var p = this.client.use('password', creds);
        expect(p.auth).to.deep.equal(creds);
        expect(this.client.getProvider()).to.equal(p);
    });

    it('exposes services eagerly', () =>{
        expect(this.client.chat).to.be.an.instanceof(require('../../lib/services/chat'));
        expect(this.client.chat.join).to.be.a('function');
    });
});
