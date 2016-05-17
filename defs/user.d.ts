import { IBeamChannel } from "./channel";

export interface IBeamUser {
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

export interface IBeamUserSelf extends IBeamUser {
  /**
   * 
   */
  allowEmail: boolean;
  /**
   * The users channel.
   */
  channel: IBeamChannel;
  /**
   * The users email address.
   */
  email: string;
  /**
   * The groups which the user is apart off.
   */
  groups: IUserGroup[];
  /**
   * Has the user got 2FA enabled.
   */
  hasTwoFactor: boolean;
  /**
   * The user preferences.
   */
  preferences: IUserPreferences;
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

export interface IUserGroup {
  /**
   * The group Id.
   */
  id: number;
  /**
   * The name of the group.
   */
  name: string;
}

export interface IUserPreferences {
  /**
   * If the player is being forced to the Flash one.
   */
  "channel:player:forceflash": boolean;
  /**
   * Should the chat be chromakeyed.
   */
  "chat:chromakey": boolean;
  /**
   * TODO: Find out about this.
   */
  "chat:colors": boolean;
  /**
   * If the user has enabled lurk mode.
   */
  "chat:lurkmode": boolean;
  /**
   * TODO: Find out about this.
   */
  "chat:sounds:html5": boolean;
  /**
   * TODO: Find out about this.
   */
  "chat:sounds:play": boolean;
  /**
   * TODO: Find out about this.
   */
  "chat:sounds:volume": number;
  /**
   * The volume which should be applied to the player.
   */
  "chat:tagging": boolean;
  /**
   * If timestamps should be shown in chat.
   */
  "chat:timestamps": boolean;
  /**
   * Is the user has whispers enabled.
   */
  "chat:whispers": boolean;
}