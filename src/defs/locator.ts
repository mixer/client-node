export interface ILocator {
    /**
     * Type of content source this is (e.g. Download, SmoothStreaming, Thumbnail etc.)
     */
    locatorType: string;

    /**
     * URL for this content source
     */
    uri: string;
}
