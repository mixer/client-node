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
 * Joins the game for a specified channel ID.
 * @param  {Number} channelId
 * @return {Promise}
 */
GameService.prototype.join = function (channelId) {
    return this.makeHandled('get', 'tetris/' + channelId + '/robot');
};

/**
 * Gets a game from a specified game ID.
 * @param  {Number} gameId
 * @return {Promise}
 */
GameService.prototype.getGame = function (gameId) {
    return this.makeHandled('get', 'tetris/games/' + gameId);
};

/**
 * Updates a game from a specified game ID.
 * @param  {Number} gameId
 * @param  {Object} data
 * @return {Promise}
 */
GameService.prototype.updateGame = function (gameId, data) {
    return this.makeHandled('put', 'tetris/games/' + gameId, data);
};

/**
 * Deletes a game from a specified game ID.
 * @param  {Number} gameId
 * @return {Promise}
 */
GameService.prototype.deleteGame = function (gameId) {
    return this.makeHandled('delete', 'tetris/games/' + gameId);
};

/**
 * Gets various information about a channel that is running an interactive game.
 * @param  {Number} channelId
 * @return {Promise}
 */
GameService.prototype.getChannelGame = function (channelId) {
    return this.makeHandled('get', 'tetris/' + channelId);
};
/**
 * Gets all the games owned by a specific user ID.
 * @param  {Number} userId
 * @return {Promise}
 */
GameService.prototype.ownedGames = function (userId) {
    return this.makeHandled('get', 'tetris/games/owned?user=' + userId);
};

/**
 * Gets a specific game and all its versions by a specific game ID and user ID.
 * @param  {Number} userId
 * @param  {Number} gameId
 * @return {Promise}
 */
GameService.prototype.ownedGameVersions = function (userId, gameId) {
    return this.makeHandled('get', 'tetris/games/owned?user=' + userId +
      '&where=id.eq.' + gameId);
};

/**
 * Gets all the games that are published.
 * @return {Promise}
 */
GameService.prototype.published = function () {
    return this.makeHandled('get', 'tetris/games');
};

/**
 * Creates a new tetris game.
 * @param  {Object} data
 * @param  {Number} data.ownerId The owner of the game being created.
 * @param  {String} data.name The name of the game being created.
 * @param  {String} data.description The description of the game being created.
 * @param  {String} data.installation The installation instructions
 * of the game being created.
 * @return {Promise}
 */
GameService.prototype.create = function (data) {
    return this.makeHandled('post', 'tetris/games', data);
};

/**
 * Creates a new version of a game for a specific game ID and user ID.
 * @param  {Object} data
 * @param  {Number} data.ownerId The owner of the game that is getting new version.
 * @param  {Number} data.gameId The game Id that version belongs to.
 * @param  {String} data.version The string representation of the version number.
 * @param  {String} data.changelog The changelog of the new version being created.
 * @param  {String} data.installation The installation instructions for new version being created.
 * @param  {String} data.download The download link for the application
 * compatible with this new version.
 * @return {Promise}
 */
GameService.prototype.createVersion = function (data) {
    return this.makeHandled('post', 'tetris/versions', data);
};

/**
 * Updates a version of a game by specific version ID.
 * @param  {Number} versionId
 * @param  {Object} data
 * @param  {Number} data.gameId The game of the version you are updating.
 * @return {Promise}
 */
GameService.prototype.updateVersion = function (versionId, data) {
    return this.makeHandled('put', 'tetris/versions/' + versionId, data);
};


module.exports = GameService;
