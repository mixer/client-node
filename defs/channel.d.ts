import { BeamUser, UserGroup } from "./user";

export interface BeamChannel {
    /**
     * The channel Id.
     */
    id: number;
    /**
     * The userId of the user who owns the channel.
     */
    userId: number;
    /**
     * The channel name.
     */
    token: string;
    /**
     * Is the channel online.
     */
    online: boolean;
    /**
     * Is the channel featured.
     */
    featured: boolean;
    /**
     * Is the channel partnered.
     */
    partnered: boolean;
    /**
     * The transcoding profile Id.
     */
    transcodingProfileId: number;
    /**
     * If the channel has been suspended.
     */
    suspended: boolean;
    /**
     * The title for the channel.
     */
    name: string;
    /**
     * The audience rating.
     */
    audience: string;
    /**
     * The channel stream key (Only shown for the logged in users channel)
     */
    streamKey?: string;
    /**
     * The total amount of viewers to the channel.
     */
    viewersTotal: number;
    /**
     * The current viewer count if the channel is live.
     */
    viewersCurrent: number;
    /**
     * Total amount of followers to the channel.
     */
    numFollowers: number;
    /**
     * The description for the channel.
     */
    description: string;
    /**
     * The typeId for the game that that is being played / streamed.
     */
    typeId: number;
    /**
     * Is the channel using an interactive game / controls.
     */
    interactive: boolean;
    /**
     * The Id of the tetris game.
     */
    tetrisGameId: number;
    /**
     * If this is not 0 the channel is streaming using FTL.
     */
    ftl: number;
    /**
     * Has the channel got a VOD (Previous stream video)
     */
    hasVod: boolean;
    /**
     * TODO: Find out what this is for.
     */
    languageId: number;
    /**
     * The Id of the cover the channel has set.
     */
    coverId: number;
    /**
     * TODO: Find out what this is for.
     */
    thumbnailId: number;
    /**
     * TODO: Find out what this is for.
     */
    badgeId: number;
    /**
     * The channel Id of the channel being hosted.
     */
    hosteeId: number;
    /**
     * Does the channel has transcodes?
     */
    hasTranscodes: boolean;
    /**
     * When the channel was created.
     */
    createdAt: string;
    /**
     * When the channel was last updated.
     */
    updatedAt: string;
    /**
     * When the channel was deleted.
     */
    deletedAt: string;
    /**
     * The background cover for the channel.
     */
    cover: {
        /**
         * Meta data about the cover.
         */
        meta: {
            /**
             * The URL to the small version of the cover.
             */
            small: string;
        }
        /**
         * The Id for the cover.
         */
        id: number;
        /**
         * The type of the cover.
         */
            type: string;
        /**
         * TODO: Find out what this is for.
         */
        relid: number;
        /**
         * The url the full version of the cover.
         */
        url: string;
        /**
         * Remote path for the cover (Used internally)
         */
        remotePath: string;
        /**
         * When the cover was created.
         */
        createdAt: string;
        /**
         * When the cover was updated.
         */
        updatedAt: string;
    };
    /**
     * TODO: Find out what this is for.
     */
    badge: string;
    /**
     * Data about the "game" type being streamed.
     */
    type: {
        /**
         * The type Id.
         */
        id: number;
        /**
         * The name of the type.
         */
        name: string;
        /**
         * The category for the type.
         */
        parent: string;
        /**
         * The description for the type.
         */
        description: string;
        /**
         * The source for when the type came from. I.E. player.me
         */
        source: string;
        /**
         * Total amount of viewers watching this type.
         */
        viewersCurrent: number;
        /**
         * The cover Url for this type.
         */
        coverUrl: string;
        /**
         * The amount of channels online using this type.
         */
        online: number;
    };
}

export interface BeamChannelUser<T> extends BeamChannel {
    /**
     * The user object.
     */
    user: T;
    /**
     * The channel preferences.
     */
    preferences: ChannelPreferences;
}

export interface ChannelPreferences {
    /**
     * Any other preferences which contain ":" in the key name which TypeScript does not support as a valid type _yet_
     */
    [preference: string]: any;
    /**
     * The share text used for when sharing the stream to social media.
     */
    sharetext: string;
}

export interface ChannelUser extends BeamUser {
    /**
     * The array of groups which the user has on the channel. I.E. Mod
     */
    groups: UserGroup[];
}
