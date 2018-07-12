import { ILocator } from './locator';

export enum Maturity {
    Family = 1,
    Teen = 2,
    EighteenPlus = 3,
}

export interface IClipProperties {
    /**
     * The content ID of this clip.
     */
    contentId: string;

    /**
     * Locator information for this highlight (including the thumbnail and content)
     */
    contentLocators: ILocator[];

    /**
     * Duration of this highlight in seconds
     */
    durationInSeconds: number;

    /**
     * Date, in string format, this content will be deleted
     */
    expirationDate: string;

    /**
     * Title of the highlight (default is the title of the live broadcast the highlight was created from)
     */
    title: string;

    /**
     * Channel ID of the owner of this highlight
     */
    ownerChannelId: number;

    /**
     * Mixer title id of source material (as opposed to xbox title id)
     */
    typeId: number;

    /**
     * ID to get the clip and share with users
     */
    shareableId: string;

    /**
     * Channel ID of the streamer this highlight was clipped from
     */
    streamerChannelId: number;

    /**
     * Date time, in string format, at which this highlight completed upload
     */
    uploadDate: string;

    /**
     * Number of views associated with this highlight
     */
    viewCount: number;

    /**
     * Maturity of the clip
     */
    contentMaturity: Maturity;

    /**
     * Tag for clips
     */
    tags: string[];
}
