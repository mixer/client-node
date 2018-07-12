export interface IClipRequest {
    /**
     * Unique id for the broadcast
     */
    broadcastId: string;

    /**
     * Title of the clip being looked for
     */
    highlightTitle: string;

    /**
     * Length of the clip to create (default 30s, min 15s, max 300s)
     */
    clipDurationInSeconds: number;
}
