import Bluebird = require("bluebird");

import Service = require("./service");
import { Client } from "../client";

import { APIQuery, Request } from "../../../defs/beam";

export class ChatService extends Service {
    constructor(client: Client) {
        super(client);
    }

    /**
     * Get the connection information for a channel to join the channels chat.
     */
    public join(channelId: number): Bluebird<Request<ChatDetails>> {
        return this.makeHandled("get", `chats/${channelId}`);
    }

    /**
     * Delete all messages in a chat for a specified channelId.
     */
    public deleteAllMessages(channelId: number): Bluebird<Request<any>> {
        return this.makeHandled("delete", `chats/${channelId}/message`);
    }

    /**
     * Deletes a message in a chat specified by a channelID and message Id.
     */
    public deleteMessage(channelId: number, messageId: string): Bluebird<Request<any>> {
        return this.makeHandled("delete", `chats/${channelId}/message/${messageId}`);
    }

    /**
     * Retrieve a list of online users in a chat specified by channelId.
     * Note: Includes lurkers if the user has the "chat:view_lurkers" permission.
     */
    public getUsers(channelId: number, filter?: APIQuery): Bluebird<Request<ChatUser[]>> {
        return this.makeHandled("get", `chats/${channelId}/users`, filter);
    }

    /**
     * Search for users within a chat specified by channelId.
     */
    public searchUsers(channelId: number, filter?: APIQuery): Bluebird<Request<ChatUser[]>> {
        return this.makeHandled("get", `chats/${channelId}/users/search`, filter);
    }
}

export interface ChatDetails {
    endpoints: string[];
    authkey: string;
    permissions: string[];
}

export interface ChatUser {
    userName: string;
    userRoles: string[];
    userId: number;
}
