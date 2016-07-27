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
 * Given a failing response from the client, processes the err object to look for a retry condition.
 * If a retry is warranted it returns true, otherwise false.
 */
Provider.prototype.handleResponseError = function () {
    return false;
};

module.exports = Provider;
