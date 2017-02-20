var errors = require('../errors');

/**
 * A service is basically a bridge/handler function for various endpoints.
 * It can be passed into the client and used magically.
 *
 * @access protected
 * @abstract
 * @param {Client} client
 */
export class Service {
    constructor (private client: Client) {}

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
    public handleResponse (res, handlers) {
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
    }

    /**
     * Simple wrapper that makes and handles a response in one go.
     *
     * @access protected
     * @return {Promise}
     */
    public makeHandled (method: string, path: string, data, handlers) {
        return this.client.request(method, path, data)
        .then(res => this.handleResponse(res, handlers));
    }
}
