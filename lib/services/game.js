var Service = require('./service');

/**
 * Service for interacting with the game endpoints on the Beam REST API.
 * @access public
 * @augments {Service}
 */
function GameService () {
    Service.apply(this, arguments);
}

GameService.prototype = new Service();

/**
 * Joins the game as a robot for a specified channel ID.
 * @param  {Number} channelId
 * @return {Promise}
 */
GameService.prototype.join = function (channelId) {
    return this.makeHandled('get', 'tetris/' + channelId + '/robot');
};


module.exports = ChatService;
