var Service = require('./service');
var util = require('util');

/**
 * The channel object
 * @typedef  {Object}              Channel
 * @property {number}              id
 * @property {string}              token
 * @property {boolean}             online
 * @property {boolean}             featured
 * @property {boolean}             partnered
 * @property {boolean}             transcodingEnabled
 * @property {boolean}             suspended
 * @property {string}              name
 * @property {string}              audience
 * @property {number}              viewersTotal
 * @property {number}              viewersCurrent
 * @property {number}              numFollowers
 * @property {string}              description
 * @property {number}              typeId
 * @property {boolean}             interactive
 * @property {number}              tetrisGameId
 * @property {number}              ftl
 * @property {boolean}             hasVod
 * @property {string}              language
 * @property {string}              createdAt
 * @property {string}              updatedAt
 * @property {string}              deletedAt
 * @property {number}              userId
 * @property {number}              coverId
 * @property {number}              badgeId
 * @property {Object}              thumbnail
 * @property {Object}              cover
 * @property {Object}              badge
 * @property {Object}              type
 * @property {Channel.Preferences} preferences
 * @property {Object}              user
 * @property {Object}              cache
 */

/**
 * Channel preferences
 * @typedef  {Object}  Channel.Preferences
 * @property {string}  sharetext
 * @property {string}  costream:allow
 * @property {number}  channel:slowchat
 * @property {boolean} channel:links:allowed
 * @property {boolean} channel:links:clickable
 * @property {boolean} channel:notify:subscribe
 * @property {boolean} channel:notify:follow
 * @property {string}  channel:notify:subscribemessage
 * @property {string}  channel:notify:followmessage
 * @property {string}  channel:partner:submail
 * @property {boolean} channel:player:muteOwn
 * @property {boolean} channel:tweet:enabled
 * @property {string}  channel:tweet:body
 */

/**
 * Service for interacting with the channel endpoints on the Beam REST API.
 * @access public
 * @augments {Service}
 */
function ChannelService () {
    Service.apply(this, arguments);
}

util.inherits(ChannelService, Service);

/**
 * Retrieves a list of all channels.
 * @param  {Object} data
 * @param  {Object} data.page The page of results to get.
 * @param  {Object} data.limit Number of results per page to retrieve.
 * @return {Promise.<Channel[]>}
 */
ChannelService.prototype.all = function (data) {
    return this.makeHandled('get', 'channels', data);
};

/**
 * Retrieves channel data for channel specified by channel
 * @param {number|string} channel Channel name or id
 * @return {Promise.<Channel>}
 */
ChannelService.prototype.getChannel = function (channel) {
    return this.makeHandled('get', 'channels/' + channel);
};

/**
 * Retrieves preferences for a channel specified by channelId
 * @param {number} channelId
 * @return {Promise.<Channel.Preferences>}
 */
ChannelService.prototype.getPreferences = function (channelId) {
    return this.makeHandled('get', 'channels/' + channelId + '/preferences');
};

module.exports = ChannelService;
