class Reply {
    /**
     * Simple wrapper that waits for a dispatches a method reply.
     */
    constructor(public resolve, public reject) {}

    /**
     * Handles "reply" packet data from the websocket.=
     */
    public handle(packet: any) {
        if (packet.error) {
            this.reject(packet.error);
        } else {
            this.resolve(packet.data);
        }
    }
}

export = Reply;
