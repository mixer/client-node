var errors = require('../errors');

/**
 * A service is basically a bridge/handler function for various endpoints.
 * It can be passed into the client and used magically.
 *
 * @access protected
 * @abstract
 * @param {Client} client
 */
function Service (client) {
    this.client = client;
}

/**
 * Takes an http response, and parses the body as a JSON string if it isn't
 * already an object. If it doesn't parse, it means that it's actually a
 * 404 (we returned html and let angular angle error display) so the
 * statusCode will be changed appropriately.
 *
 * @access protected
 * @param  {Object} res
 */
Service.prototype.extractBody = function (res) {
    try {
        res.body = JSON.parse(res.body);
    } catch (e) {
        res.statusCode = 404;
    }
};

/**
 * Takes a response. If the status code isn't 200, attempt to find an
 * error handler for it or throw unknown error. If it's all good,
 * we return the response synchronously.
 *
 * @access protected
 * @param  {Object} res
 * @param  {Object} handlers
 * @return {Object}
 */
Service.prototype.handleResponse = function (res, handlers) {
    this.extractBody(res);

    // 200 codes are already great!
    if (res.statusCode === 200) {
        return res;
    }

    // Otherwise, we have to handle it.
    var Handler = handlers && handlers[res.statusCode];
    if (!Handler) {
        Handler = errors.UnknownCodeError;
    }

    throw new Handler(res);
};

/**
 * Simple wrapper that makes and handles a response in one go.
 *
 * @access protected
 * @return {Promise}
 */
Service.prototype.makeHandled = function (method, path, data, handlers) {
    return this.client.request(method, path, data).bind(this).then(function (res) {
        return this.handleResponse(res);
    });
};

module.exports = Service;
