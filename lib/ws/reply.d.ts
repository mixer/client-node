declare class Reply {
    /**
     * Simple wrapper that waits for a dispatches a method reply.
     */
    constructor(resolve: Promise.Resolver<any>, reject: Promise.RejectionError);

    /**
     * Handles "reply" packet data from the websocket.
     */
    handle(packet: any): Promise<any>;
}

export = Reply;
