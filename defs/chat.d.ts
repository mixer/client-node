export interface ChatPreferences {
    /**
     * Any preferences which contain ":" in the key name which TypeScript does not support as a valid type _yet_
     */
    [preference: string]: any;
}

interface UserAuthenticated {
    /**
     * If you are authenticated on the socket.
     */
    authenticated: boolean;
    /**
     * The roles the user has.
     */
    roles: string[];
}

export interface ChatMessage {
    /**
     * The Id of the message.
     */
    id: string;
    /**
     * The channel Id.
     */
    channel: number;
    /**
     * The user's Id.
     */
    user_id: number;
    /**
     * The user's name.
     */
    user_name: string;
    /**
     * The roles the user has.
     */
    user_roles: string[];
    /**
     * The message payload.
     */
    message: {
        /**
         * The message parts.
         */
        message: MessagePart[];
        /**
         * The meta for the message.
         */
        meta: {
            me?: boolean;
            whisper?: boolean;
        }
    };
}

interface MessagePart {
    /**
     * The type of the message part.
     */
        type: "text" | "link" | "emoticon" | "tag" | "inaspacesuit";
    /**
     * The source of the emote.
     */
    source?: "builtin" | "external";
    /**
     * The location of the spite.
     * Note: This would be a URL for partner emotes.
     */
    pack?: "default" | string;
    /**
     * The location of the emote on the sprite sheet.
     */
    coords?: {
        /**
         * The x location of the emote on the sprite.
         */
        x: number;
        /**
         * The y location of the emote on the sprite.
         */
        y: number;
        /**
         * The height of the emote.
         */
        height: number;
        /**
         * The width of the emote.
         */
        width: number;
    };
    /**
     * The Id of the user name. (Defined when you are handling a "tag" part)
     */
    id?: number;
    /**
     * The username of the user. (Defined when you are handling a "tag" part)
     */
    username?: string;
    /**
     * The raw text value of the message part.
     */
    text?: string;
}

interface UserUpdate {
    /**
     * The user's Id.
     */
    user: number;
    /**
     * The username for the user. (This could be the new name if the user changes their name)
     */
    username: string;
    /**
     * The roles the user has.
     */
    roles: string[];
    /**
     * The permissions which the user has.
     */
    permissions: string[];
}

interface PollStart {
    /**
     * The question being asked.
     */
    q: string;
    /**
     * The answers for the poll.
     */
    answers: string[];
    /**
     * The duration for the poll.
     */
    duration: number;
    /**
     * The ISO time for when the poll ends.
     */
    endsAt: number;
}

interface PollEnd {
    /**
     * How many users entered the poll.
     */
    voters: number;
    /**
     * The responses for the poll.
     */
    responses: Array<{
        [answer: string]: number;
    }>;
}

interface UserConnection {
    /**
     * The user's Id.
     */
    id: number;
    /**
     * The user's name.
     */
    username: string;
    /**
     * The roles the user has.
     */
    roles: string[];
}

interface DeleteMessage {
    /**
     * The message Id.
     */
    id: string;
}

interface PurgeMessage {
    /**
     * The user's Id.
     */
    user_id: number;
}

interface UserTimeout {
    user: {
        /**
         * The user's Id.
         */
        user_id: number;
        /**
         * The user's name.
         */
        user_name: string;
        /**
         * The roles the user has.
         */
        user_roles: string[];
    },
    /**
     * The duration of the timeout.
     */
    duration: number;
}
