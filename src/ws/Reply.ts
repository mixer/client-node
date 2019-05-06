import { IPacket } from '././types';

/**
 * Simple wrapper that waits for a dispatches a method reply.
 */
export class Reply {
    constructor(
        private resolve: (value: IPacket['data']) => void,
        private reject: (value: IPacket['error']) => void,
    ) {}

    /**
     * Handles "reply" packet data from the websocket.
     */
    public handle(packet: IPacket) {
        if (packet.error) {
            this.reject(packet.error);
        } else {
            this.resolve(packet.data);
        }
    }
}
