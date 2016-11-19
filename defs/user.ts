import { BeamChannel } from "./channel";

export interface BeamUser {
    /**
     * The user Id.
     */
    id: number;
    /**
     * The username.
     */
    username: string;
    /**
     * Has the user been verified. (Email checks)
     */
    verified: boolean;
    /**
     * The level of the user.
     */
    level: number;
    /**
     * The amount of experience the user has.
     */
    experience: number;
    /**
     * The amount of sparks the user has earned.
     */
    sparks: number;
    /**
     * The Url to the users avatar.
     */
    avatarUrl: string;
    /**
     * Short bio about the user.
     */
    bio: string;
    /**
     * Social links for the user. (Note: The social object can be null)
     */
    social: {
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
         * The Discord user with Id.
         */
        discord: string;
    };
    /**
     * The Id of the primary team the user is apart off.
     */
    primaryTeam: number;
    /**
     * Date of when the user was created.
     */
    createdAt: string;
    /**
     * Date of when the user was updated.
     */
    updatedAt: string;
    /**
     * Date of when the user was deleted.
     */
    deletedAt: string;
}

export interface BeamUserSelf extends BeamUser {
    /**
     *
     */
    allowEmail: boolean;
    /**
     * The users channel.
     */
    channel: BeamChannel;
    /**
     * The users email address.
     */
    email: string;
    /**
     * The groups which the user is apart off.
     */
    groups: UserGroup[];
    /**
     * Has the user got 2FA enabled.
     */
    hasTwoFactor: boolean;
    /**
     * The user preferences.
     */
    preferences: any;
    /**
     * Details about the 2FA for the user.
     */
    twoFactor: {
        /**
         * Has the user viewed their 2FA backup codes.
         */
        codesViewed: boolean;
        /**
         * Is 2FA enabled.
         */
        enabled: boolean;
    }
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
