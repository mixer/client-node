var request = require('../../lib/request');
var Client = require('../../lib/client');

require('chai').use(require('chai-subset'));
require('chai').use(require('sinon-chai'));

beforeEach(() => {
    this.client = new Client();
    this.response = {};
    request.run = (data, callback) => {
        this.request = data;
        callback(null, this.response);
    };
});

afterEach(() => {
    request.restore();
});
