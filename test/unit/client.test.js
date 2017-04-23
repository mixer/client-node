const { expect } = require('chai');

describe('beam client', function() {
    it('builds urls correctly', function() {
        expect(this.client.buildAddress('https://beam.pro/', '/foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro/', 'foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', '/foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
        expect(this.client.buildAddress('https://beam.pro', 'foo/bar'))
        .to.equal('https://beam.pro/foo/bar');
    });

    it('sets the url', function() {
        expect(this.client.setUrl('api', 'http://example.com'));
        expect(this.client.urls.api).to.equal('http://example.com');
    });

    it('makes a request successfully', function() {
        this.response.a = 'b';

        return this.client.request('get', '/users/current', { a: 'b' })
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

    it('parses json results', function() {
        this.response.body = { foo: 'bar' };

        return this.client.request('get', '/users/current', { a: 'b' })
        .then(res => {
            expect(res.body).to.deep.equal({ foo: 'bar' });
        });
    });

    it('makes a request with errors', function() {
        this.request.run = (d, cb) => {
            return Promise.reject(new Error('oh no!'));
        };
        return this.client.request('get', '/users/current', { a: 'b' })
        .catch(e => {
            expect(e.message).to.equal('oh no!');
        });
    });

    it('creates and uses a provider', function() {
        const { PasswordProvider } = require('../..');
        const provider = new PasswordProvider(this.client, { username: 'connor', password: 'password' })
        this.client.use(provider);
        expect(this.client.getProvider()).to.equal(provider);
    });
});
