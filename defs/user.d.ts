import { Channel } from "./channel";
import { Social, UserGroup } from "./beam";

export interface User {
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
    social: Social;
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
    /**
     * The array of groups which the user has on the channel. I.E. Mod
     */
    groups: UserGroup[];
    /**
     * The users channel.
     */
    channel: Channel;
}

export interface UserSelf extends User {
    /**
     * Not sure what this means / does.
     */
    allowEmail: boolean;
    /**
     * The users email address.
     */
    email: string;
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
    };
}
