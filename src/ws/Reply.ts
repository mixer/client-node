import { ErrorCode } from '../errors';

export interface IPacket {
  error: string | IErrorPacket;
  data: any;
}

export interface IErrorPacket {
  code: ErrorCode;
  message: string;
  stacktrace: string;
}

/**
 * Simple wrapper that waits for a dispatches a method reply.
 */
export class Reply {
  constructor(private resolve: (value: any) => void, private reject: (value: any) => void) {}

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
