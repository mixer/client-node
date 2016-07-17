export interface Recording {
    /**
     * The unique Id of the recording.
     */
    id: number;
    /**
     * The channel Id this recording is a video of.
     */
    name: string;
    /**
     * The type Id.
     */
    typeId: any;
    /**
     * The state of the recording.
     */
    state: "PROCESSING" | "AVAILABLE" | "DELETED";
    /**
     * The number of users who have viewed this recording.
     */
    viewsTotal: number;
    /**
     * The duration of the recording.
     */
    duration: number;
    /**
     * The date this recording will be deleted at.
     */
    expiresAt: string;
    /**
     * The date this recording ended at.
     */
    createdAt: string;
    /**
     * The data of when the recoding was last updated.
     */
    updatedAt: string;
    /**
     * The channel Id from when the recording was taken from.
     */
    channelId: number;
    /**
     * Whether the current user has viewed the recording.
     * This will generally only appear when the recording is looked up from an endpoint with user in the query string.
     */
    viewed?: boolean;
    /**
     * The VODs for the recording in different formats / qualities.
     */
    vods: Vod[];
}

export interface Vod {
    /**
     * Format-specific information about the Vod. Note: Can be null.
     */
    data: {
        /**
         * The width of the Vod.
         */
        Width: number;
        /**
         * The height of the Vod.
         */
        Height: number;
        /**
         * The FPS of the Vod.
         */
        Fps: number;
        /**
         * The bitrate of the Vod.
         */
        Bitrate: number;
    };
    /**
     * The unique Id of the VOD.
     */
    id: string;
    /**
     * The IP/host if of the server this Vod is stored on.
     */
    storageNode: string;
    /**
     * For HLS and DASH formats, the URL of their manifest.
     * For MPEG-4 videos (RAW/THUMB formats) a direct link to the files.
     */
    mainUrl: string;
    /**
     * The format of the Vod.
     */
    format: "dash" | "hls" | "thumbnail" | "chat" | "raw";
    /**
     * The date of the the Vod was created.
     */
    createdAt: string;
    /**
     * The data of when the Vod was last updated.
     */
    updatedAt: string;
    /**
     * The Id of the recording which this Vod is linked too.
     */
    recordingId: number;
}
