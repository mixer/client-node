var Service = require('./service');

/**
 * Service for interacting with the game endpoints on the Beam REST API.
 * @access public
 * @augments {Service}
 */
class GameService {

    /**
     * Joins the game for a specified channel ID.
     * @param  {Number} channelId
     * @return {Promise}
     */
    public join (channelId) {
        return this.makeHandled('get', 'interactive/' + channelId + '/robot');
    }

    /**
     * Gets a game from a specified game ID.
     * @param  {Number} gameId
     * @return {Promise}
     */
    public getGame (gameId) {
        return this.makeHandled('get', 'interactive/games/' + gameId);
    }

    /**
     * Updates a game from a specified game ID.
     * @param  {Number} gameId
     * @param  {Object} data
     * @return {Promise}
     */
    public updateGame (gameId, data) {
        return this.makeHandled('put', 'interactive/games/' + gameId, data);
    }

    /**
     * Deletes a game from a specified game ID.
     * @param  {Number} gameId
     * @return {Promise}
     */
    public deleteGame (gameId) {
        return this.makeHandled('delete', 'interactive/games/' + gameId);
    }

    /**
     * Gets various information about a channel that is running an interactive game.
     * @param  {Number} channelId
     * @return {Promise}
     */
    public getChannelGame (channelId) {
        return this.makeHandled('get', 'interactive/' + channelId);
    }

    /**
     * Gets all the games owned by a specific user ID.
     * @param  {Number} userId
     * @return {Promise}
     */
    public ownedGames (userId) {
        return this.makeHandled('get', 'interactive/games/owned?user=' + userId);
    }

    /**
     * Gets a specific game and all its versions by a specific game ID and user ID.
     * @param  {Number} userId
     * @param  {Number} gameId
     * @return {Promise}
     */
    public ownedGameVersions (userId, gameId) {
        return this.makeHandled('get', 'interactive/games/owned?user=' + userId +
        '&where=id.eq.' + gameId);
    };

    /**
     * Gets all the games that are published.
     * @return {Promise}
     */
    public published () {
        return this.makeHandled('get', 'interactive/games');
    }

    /**
     * Creates a new interactive game.
     * @param  {Object} data
     * @param  {Number} data.ownerId The owner of the game being created.
     * @param  {String} data.name The name of the game being created.
     * @param  {String} data.description The description of the game being created.
     * @param  {String} data.installation The installation instructions
     * of the game being created.
     * @return {Promise}
     */
    public create (data) {
        return this.makeHandled('post', 'interactive/games', data);
    }

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
    public createVersion (data) {
        return this.makeHandled('post', 'interactive/versions', data);
    }

    /**
     * Updates a version of a game by specific version ID.
     * @param  {Number} versionId
     * @param  {Object} data
     * @param  {Number} data.gameId The game of the version you are updating.
     * @return {Promise}
     */
    public updateVersion (versionId, data) {
        return this.makeHandled('put', 'interactive/versions/' + versionId, data);
    }
}
