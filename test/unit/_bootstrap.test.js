const { Client } = require('../../src');

require('chai').use(require('chai-subset'));
require('chai').use(require('sinon-chai'));

beforeEach(function () {
    this.request = {
        run: (data) => {
            this.request = data;
            return Promise.resolve(this.response);
        }
    };
    this.client = new Client(this.request);
    this.response = {};
});
