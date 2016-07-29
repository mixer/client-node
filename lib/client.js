var Bluebird = require('bluebird');
var Services = require('./services');

var querystring = require('querystring');
var request = require('./request');
var pkg = require('../package');
var _ = require('lodash');

function buildUserAgent () {
    var client = 'BeamClient/' + pkg.version;

    if (typeof navigator !== 'undefined') { // in-browser
        return navigator.userAgent + ' ' + client;
    }

    return client + ' (JavaScript; Node.js ' + process.version + ')';
}

/**
 * The primary Beam client, responsible for storing authentication state
 * and dispatching requests to the API.
 * @access public
 */
function Client () {
    this.provider = null;
    this.userAgent = buildUserAgent();
    this.urls = {
        api: 'https://beam.pro/api/v1',
        public: 'https://beam.pro',
    };

    var self = this;

    _.forIn(Services, function (Service, key) {
        self[key] = new Service(self);
    });
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
    // eslint-disable-next-line global-require
    var Provider = require('./providers/' + provider);
    this.provider = new Provider(this, options);

    return this.provider;
};

/**
 * Returns the associated provider instance, as set by the
 * `use` method.
 * @return {Object}
 */
Client.prototype.getProvider = function () {
    return this.provider;
};

/**
 * Attempts to run a given request.
 * @access public
 * @param  {String}  method Request method, such as GET, POST, etc.
 * @param  {String}  path   Relative path on Beam, such as /users/current
 * @param  {Object}  data   An object with data to be extended into request.
 * @return {Promise} Resolved in 200 OK, otherwise rejected.
 */
Client.prototype.request = function (method, path, data) {
    var url = this.buildAddress(this.urls.api, path);
    var req = _.defaultsDeep(data || {}, _.extend(
        {
            method: method,
            url: url,
            headers: {
                'User-Agent': this.userAgent,
            },
            json: true,
        },
        this.provider ? this.provider.getRequest() : {}
    ));

    return new Bluebird(function (resolve, reject) {
        request.run(req, function (err, res) {
            if (err) {
                reject(err);
                return;
            }
            resolve(res);
        });
    }).bind(this)
    .catch(function (err) {
        if (this.provider) {
            return this.provider.handleResponseError(err, [method, path, data]);
        }
        throw err;
    }.bind(this));
};

module.exports = Client;
