export interface Social {
    /**
     * Twitter Url.
     */
    twitter: string;
    /**
     * Facebook Url.
     */
    facebook: string;
    /**
     * Player.me Url.
     */
    player: string;
    /**
     * YouTube Url.
     */
    youtube: string;
    /**
     * Discord
     */
    discord: string;
}

export interface Request<T> {
    /**
     * Body containing the data requested. (Or an error)
     */
    body: T;
    /**
     * The status code from the request.
     */
    statusCode: number;
}

export interface UserGroup {
    /**
     * The group Id.
     */
    id: number;
    /**
     * The name of the group.
     */
    name: string;
}

export type APIQuery = {
    start?: number,
    limit?: number,
    page?: number,
    where?: string,
    fields?: string,
    username?: string;
};
