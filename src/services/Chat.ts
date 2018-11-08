import { IResponse } from '../RequestRunner';
import { Service } from './Service';

export interface IChatJoinResponse {
    endpoints: string[];
    authkey: string;
    permissions: string[];
}

export interface IUsersResponse {
    userName: string;
    userRoles: string[];
    userId: number;
}

/**
 * Service for interacting with the chat endpoints on the Mixer REST API.
 */
export class ChatService extends Service {

    /**
     * Joins the chat for a specified channel ID.
     */
    public join(channelId: number): Promise<IResponse<IChatJoinResponse>> {
        return this.makeHandled<IChatJoinResponse>('get', `v2/chat/${channelId}`);
    }

    /**
     * Retrieve a list of online users in a chat specified by channelId.
     */
    public getUsers(channelId: number, data: { page: number; limit: number }): Promise<IResponse<IUsersResponse[]>> {
        return this.makeHandled<IUsersResponse[]>('get', `v2/chat/${channelId}/users`, {
            qs: data,
        });
    }

    /**
     * Search for users within a chat specified by channelId.
     */
    public searchUsers(channelId: number, data: { username: string; page: number; limit: number}): Promise<IResponse<IUsersResponse[]>> {
        return this.makeHandled('get', `v2/chat/${channelId}/users/search`, {
            qs: data,
        });
    }
}
