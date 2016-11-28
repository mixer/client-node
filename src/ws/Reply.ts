export interface IPacket {
    error: string;
    data: any;
}

/**
 * Simple wrapper that waits for a dispatches a method reply.
 */
export class Reply {
    constructor (private resolve: (value: any) => void, private reject: (value: any) => void) {}

    /**
     * Handles "reply" packet data from the websocket.
     */
    public handle (packet: IPacket) {
        if (packet.error) {
            this.reject(packet.error);
        } else {
            this.resolve(packet.data);
        }
    }
}

module.exports = Reply;
