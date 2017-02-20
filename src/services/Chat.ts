import { Service } from './Service';

/**
 * Service for interacting with the chat endpoints on the Beam REST API.
 * @access public
 * @augments {Service}
 */
export class ChatService extends Service {

    /**
     * Joins the chat for a specified channel ID.
     * @param  {Number} channelId
     * @return {Promise}
     */
    public join(channelId: number) {
        return this.makeHandled('get', 'chats/' + channelId);
    }

    /**
     * Delete all messages in a chat for a specified channelID.
     * @param  {Number} channelId
     * @return {Promise}
     */
    public deleteAllMessages (channelId: number) {
        return this.makeHandled('delete', 'chats/' + channelId + '/message');
    }

    /**
     * Deletes a message in a chat specified by a channelID and message ID.
     * @param  {Number} channelId
     * @param  {String} messageId
     * @return {Promise}
     */
    public deleteMessage (channelId: number, messageId: number) {
        return this.makeHandled('delete', 'chats/' + channelId + '/message/' + messageId);
    }

    /**
     * Retrieves messages for a chat specified by a channelID.
     * @param  {Number} channelId
     * @param  {Object} data
     * @param  {Number} data.start The start of the time range to query for messages.
     * Should be given as a unix timestamp with milliseconds.
     * @param  {Number} data.end The end of the time range to query for messages.
     * Should be given as a unix timestamp with milliseconds.
     * @param  {Number} data.limit The maximum number of results to retrieve.
     * If there are more results in the range than can be shown,
     * the first limit messages from the end time will be displayed.
     * @return {Promise}
     */
    public getMessages (channelId: number, data) {
        return this.makeHandled('get', 'chats/' + channelId + '/message', data);
    }

    /**
     * Retrieve a list of online users in a chat specified by channelId.
     * @param  {Number} channelId
     * @param  {Object} data
     * @param  {Object} data.page The page of results to get.
     * @param  {Object} data.limit Number of results per page to retrieve.
     * @return {Promise}
     */
    public getUsers (channelId: number, data) {
        return this.makeHandled('get', 'chats/' + channelId + '/users', data);
    }

    /**
     * Search for users within a chat specified by channelId.
     * @param  {Number} channelId
     * @param  {Object} data
     * @param  {Object} data.username The username to search by.
     * @param  {Object} data.page The page of results to get.
     * @param  {Object} data.limit Number of results per page to retrieve.
     * @return {Promise}
     */
    public searchUsers (channelId: number, data) {
        return this.makeHandled('get', 'chats/' + channelId + '/users/search', data);
    }

    /**
     * Update a chat's settings specified by channelId
     * @param {Number}  channelId
     * @param {Object}  data
     * @param {Boolean} data.linksAllowed Whether links are allowed
     * to be posted in the chat.
     * @param {Boolean} data.linksClickable Whether links are allowed
     * to be clicked from the chat.
     * @param {Number}  data.slowchat The time interval, in seconds,
     * that users have to wait between sending messages.
     * @return {Promise}
     */
    public updateSettings (channelId: number, data) {
        return this.makeHandled('put', 'chats/' + channelId, data);
    }
}
