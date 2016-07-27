var Bluebird = require('bluebird');
function Provider (client) {
    this.client = client;
}

Provider.prototype.attempt = function () {
    throw new Error('Not Immplemented');
};

Provider.prototype.getRequest = function () {
    return {};
};

/**
 * Given a failing response from the client, processes the error object and returns a Promise
 * which allows for a provider to retry a request or carry out some other process
 * @return {Promise.<>}
 */
Provider.prototype.handleResponseError = function (err) {
    return Bluebird.reject(err);
};

module.exports = Provider;
