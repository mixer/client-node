import Service = require("./service");

import { BeamRequest } from "../../defs/request";
import { ChatPreferences } from "../../defs/chat";

declare class ChatService extends Service {
    /**
     * Joins the chat for a specified channel ID.
     */
    join(channelId: number): Promise<BeamRequest<IJoinResponse>>;

    /**
     * Delete all messages in a chat for a specified channelID.
     */
    deleteAllMessages(channelId: number): Promise<BeamRequest<string>>;

    /**
     * Retrieve a list of online users in a chat specified by channelId.
     */
    getUsers(channelId: number, data?: { page?: number, limit?: number }): Promise<BeamRequest<IUsersResponse[]>>;

    /**
     * Search for users within a chat specified by channelId.
     */
    searchUsers(channelId: number, data: { username: string, page?: number, limit?: number }): Promise<BeamRequest<IUsersResponse[]>>;

    /**
     * Update a chat's settings specified by channelId.
     */
    updateSettings(channelId: number, data: any): Promise<BeamRequest<ChatPreferences>>;
}

interface IJoinResponse {
    endpoints: string[];
    authkey: string;
    permissions: string[];
}

interface IUsersResponse {
    userName: string;
    userRoles: string[];
    userId: number;
}

export = ChatService;
