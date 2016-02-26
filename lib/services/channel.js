var Service = require('./service');

/**
 * Service for interacting with the channel endpoints on the Beam REST API.
 * @access public
 * @augments {Service}
 */
function ChannelService () {
    Service.apply(this, arguments);
}

ChannelService.prototype = new Service();

/**
 * Retrieves a list of all channels.
 * @param  {Object} data
 * @param  {Object} data.page The page of results to get.
 * @param  {Object} data.limit Number of results per page to retrieve.
 * @return {Promise}
 */
ChannelService.prototype.all = function (data) {
    return this.makeHandled('get', 'channels', data);
};

/**
 * Retrieves channel data for channel specified by channel
 * @param {Number|String} channel Channel name or id
 * @return {Promise}
 */
ChannelService.prototype.getChannel = function (channel) {
    return this.makeHandled('get', 'channels/' + channel);
};

/**
 * Retrieves preferences for a channel specified by channelId
 * @param {Number} channelId
 * @return {Promise}
 */
ChannelService.prototype.getPreferences = function (channelId) {
    return this.makeHandled('get', 'channels/' + channelId + '/preferences')
};

module.exports = ChannelService;