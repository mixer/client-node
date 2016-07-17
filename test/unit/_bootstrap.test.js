"use strict";

const request = require("../../js/lib/request");
const Client = require("../../js").Client;

require("chai").use(require("chai-subset"));
require("chai").use(require("sinon-chai"));

beforeEach(function () {
    this.client = new Client();
    this.response = {};
    request.run = (function (data, callback) {
       this.request = data;
        callback(null, this.response);
    }).bind(this);
});

afterEach(function () {
    request.restore();
});
