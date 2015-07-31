var Bluebird = require('bluebird');

var querystring = require('querystring');
var request = require('./request');
var _ = require('lodash');

var BaseProvider = require('./providers/base');

/**
 * The primary Beam client, repsonsible for storing authentication state
 * and dispatching requests to the API.
 * @access public
 */
function Client () {
    this.provider = new BaseProvider();
    this.beamUrl = 'https://beam.pro/api/v1';
    this.user = null;
}

/**
 * Gets information about the user, which was given when we authed.
 * @access public
 * @return {Object}
 */
Client.prototype.getUser = function () {
    return this.user;
};

/**
 * Sets the base URL the client should look for the API at.
 * @access public
 * @param {String} url
 * @return {Client}
 */
Client.prototype.setUrl = function (url) {
    this.beamUrl = url;
    return this;
};

/**
 * Builds a path to the Beam API by concating it with the address.
 * @param  {String} path
 * @param  {Object} querystr
 * @return {String}
 */
Client.prototype.buildAddress = function (path, querystr) {
    var url = this.beamUrl;
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
 * Attempts to set up authentication with the given provider instance.
 * It returns a promise, which is rejected if authentication fails.
 * @access public
 * @param  {Provider} provider
 * @return {Promise}
 */
Client.prototype.auth = function (provider) {
    this.provider = provider;
    provider.use(this);

    return provider.attempt().bind(this).then(function (res) {
        this.user = JSON.parse(res.body);
    });
};

/**
 * "Uses" a Service by injecting the current client into its constructor.
 * @param  {Object} Service
 * @return {Service}
 */
Client.prototype.use = function (Service) {
    return new Service(this);
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
    var url = this.buildAddress(path);
    var req = _.extend({ method: method, url: url }, this.provider.getRequest(), data);

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
