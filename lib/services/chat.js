var Service = require('./service');

/**
 * Service for interacting with the chat endpoints on the Beam REST API.
 * @access public
 */
function ChatService () {
    Service.apply(this, arguments);
}

ChatService.prototype = new Service();

/**
 * Joins the chat for a specified channel ID.
 * @param  {Number} channelId
 * @return {Promise}
 */
ChatService.prototype.join = function (channelId) {
    return this.makeHandled('get', 'chats/' + channelId);
};

module.exports = ChatService;
