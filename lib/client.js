var Bluebird = require('bluebird');

var querystring = require('querystring');
var request = require('./request');
var _ = require('lodash');

var GameService = require('./services/game');

/**
 * The primary Beam client, repsonsible for storing authentication state
 * and dispatching requests to the API.
 * @access public
 */
function Client () {
    this.provider = null;
    this.urls = {
        api: 'https://beam.pro/api/v1',
        public: 'https://beam.pro'
    };

    this.game = new GameService(this);
}

/**
 * Sets the the API/public URLs for the client.
 *
 * @access public
 * @param {String} type one of "public" (Beam frontend) or "private"
 *                      (ends in /api/v[0-9])
 * @param {String} url
 * @return {Client}
 */
Client.prototype.setUrl = function (type, url) {
    this.urls[type] = url;
    return this;
};

/**
 * Builds a path to the Beam API by concating it with the address.
 * @private
 * @param  {String} base
 * @param  {String} path
 * @param  {Object} querystr
 * @return {String}
 */
Client.prototype.buildAddress = function (base, path, querystr) {
    var url = base;

    // Strip any trailing slash from the base
    if (url.slice(-1) === '/') url = url.slice(0, -1);
    // And any leading slash from the path.
    if (path.charAt(0) === '/') path = path.slice(1);

    url = url + '/' + path;

    // And just add the query string
    if (querystr) url += '?' + querystring.encode(querystr);

    return url;
};

/**
 * Creates and returns an authentication provider instance.
 * @access public
 * @param  {String} provider
 * @param  {Object} options
 * @return {Provider}
 */
Client.prototype.use = function (provider, options) {
    var Provider = require('./providers/' + provider);
    this.provider = new Provider(this, options);

    return this.provider;
};

/**
 * Returns the associated provider instance, as set by the
 * `use` method.
 * @return {Object}
 */
Client.prototype.getProvider = function (Service) {
    return this.provider;
};

/**
 * Attempts to run a given request.
 * @access public
 * @param  {String} method Request method, such as GET, POST, etc.
 * @param  {Strig}  path   Relative path on Beam, such as /users/current
 * @param  {Object} data   An object with data to be extended into request.
 * @return {Promise} Resolved in 200 OK, otherwise rejected.
 */
Client.prototype.request = function (method, path, data) {
    var url = this.buildAddress(this.urls.api, path);
    var req = _.extend(
        { method: method, url: url },
        this.provider ? this.provider.getRequest() : {},
        data
    );

    return new Bluebird(function (resolve, reject) {
        request.run(req, function (err, res) {

            try { res.body = JSON.parse(res.body); } catch (e) {}

            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    }).bind(this);
};

module.exports = Client;
