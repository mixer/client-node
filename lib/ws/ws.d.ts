import { EventEmitter } from "events";

import { BadMessageError, NoMethodHandlerError } from "../errors";

declare class BeamSocket extends EventEmitter {
  /**
   * Constructor for the class to create the socket handle / connection.
   */
  constructor(addresses: string[]);
  /**
   * Which connection we use in our load balancing.
   */
  private _addressOffset: number;
  /**
   * List of addresses we can connect to.
   */
  private _addresses: string[];
  /**
   * Spool to store events queued when the connection is lost.
   */
  private _spool: string[];
  /**
   * The WebSocket instance we're currently connected with.
   */
  ws: WebSocket;
  /**
   * The status of the socket connection.
   */
  status: ISocketStatus;
  /**
   * Counter of the current number of reconnect retries, and the number of retries before we reset our reconnect attempts.
   */
  private _retries: number;
  /**
   * Max 2 minute retry time.
   */
  private _retryWrap: number;
  /**
   * Timeout waiting to reconnect
   */
  private _reconnectTimeout: any;
  /**
   * Number of milliseconds to wait in .call() before we give up waiting or the reply. Used to prevent leakages.
   */
  callTimeout: number;
  /**
   * Map of call IDs to promises that should be resolved on method responses.
   */
  private _replies: {};
  /**
   * Authentication packet store that we'll resend if we have to reconnect.
   */
  private _authpacket: string;
  /**
   * Counter for method calls.
   */
  private _callNo: number;
  /**
   * The timeout error for the socket.
   */
  TimeoutError: TimeoutError;
  /**
   * Set the socket status values.
   */
  IDLE: number;
  CONNECTED: number;
  CLOSING: number;
  CLOSED: number;
  CONNECTING: number;
  /**
   * Gets the status of the socket connection.
   */
  getStatus(): ISocketStatus;
  /**
   * Returns whether the socket is currently connected.
   */
  isConnected(): boolean;
  /**
   * Retrieves a chat endpoint to connect to. We use round-robin balancing.
   */
  protected getAddress(): string;
  /**
   * Returns how long to wait before attempting to reconnect. This does TCP-style limited exponential backoff.
   */
  private _getNextReconnectInterval(): number;
  /**
   * _handleClose is called when the websocket closes or emits an error. If we weren't gracefully closed, we'll try to reconnect.
   */
  private _handleClose(): void;
  /**
   * Starts a socket client. Attaches events and tries to connect to a chat server.
   */
  boot(): this;
  /**
   * Should be called on reconnection. Authenticates and sends follow-up packets if we have any. After we get re-established with auth
   * we'll formally say this socket is connected. This is to prevent race conditions where packets could get send before authentication
   * is reestablished.
   */
  protected unspool(): void;
  /**
   * Parses an incoming packet from the websocket.
   */
  protected parsePacket(data: string, flags: {}): any;
  /**
   * Sends raw packet data to the server. It may not send immediately; if we aren't connected, it'll just be spooled up.
   */
  protected send(data: {}, options?: { force: boolean }): void;
  /**
   * Auth sends a packet over the socket to authenticate with a chat server and join a specified channel. If you wish to join anonymously, user and authkey can be omitted.
   */
  auth(channelId: number, userId?: number, authKey?: string): Promise<ISocketAuthed>;
  /**
   * Runs a method on the socket. Returns a promise that is rejected or resolved upon reply.
   */
  call(method: string, args: (string|number)[], options?: { noReply?: boolean, force?: boolean }): Promise<any>;
  call(method: "auth", args: [number], options?: { noReply?: boolean, force?: boolean }): Promise<ISocketAuthed>;
  call(method: "auth", args: [number, number, string], options?: { noReply?: boolean, force?: boolean }): Promise<ISocketAuthed>;
  call(method: "msg", args: [string], options?: { noReply?: boolean, force?: boolean }): Promise<any> | Promise<IChatMessage>;
  call(method: "whisper", args: [string, string], options?: { noReply?: boolean, force?: boolean }): Promise<any>;
  call(method: "history", args: [number], options?: { noReply?: boolean, force?: boolean }): Promise<IChatMessage[]>;
  /**
   * Closes the websocket gracefully.
   */
  close(): void;
  /**
   * Define the "on" methods this socket will emit.
   */
  on(event: string, cb: () => any): this;
  on(event: "connected", cb: () => any): this;
  on(event: "closed", cb: () => any): this;
  on(event: "error", cb: (err: Error) => any): this;
  on(event: "authresult", cb: (res: ISocketAuthed) => any): this;
  on(event: "packet", cb: (packet: any) => any): this;
  on(event: "ChatMessage", cb: (message: IChatMessage) => any): this;
  on(event: "UserUpdate", cb: (update: IUserUpdate) => any): this;
  on(event: "PollStart", cb: (poll: IPollStart) => any): this;
  on(event: "PollEnd", cb: (poll: IPollEnd) => any): this;
  on(event: "UserJoin", cb: (join: IUserJoin) => any): this;
  on(event: "UserLeave", cb: (join: IUserJoin) => any): this;
  on(event: "ClearMessages", cb: () => any): this;
  on(event: "DeleteMessage", cb: (message: IDeleteMessage) => any): this;
}

declare enum ISocketStatus {
  IDLE = 0,
  CONNECTED = 1,
  CLOSING = 2,
  CLOSED = 3,
  CONNECTING = 4
}

interface TimeoutError extends Error {}

interface ISocketAuthed {
  authenticated: boolean;
  roles: string[];
}

interface IChatMessage {
  channel: number;
  id: string;
  user_id: number;
  user_name: string;
  user_roles: string[];
  message: {
    message: IBeamMessage[];
    meta: {
      me?: boolean;
      whisper?: boolean;
    }
  };
}

interface IBeamMessage {
  type: "text" | "link" | "emoticon" | "tag" | "inaspacesuit";
  data: string;
  source?: string;
  pack?: string;
  coords?: {
    x: number;
    y: number;
  };
  text?: string;
}

interface IUserUpdate {
  username: string;
  user: number;
  roles: string[];
  permissions: string[];
}

interface IPollStart {
  /**
   * The question being asked.
   */
  q: string;
  /**
   * The answers for the poll.
   */
  answers: string[];
  /**
   * The duration for the poll.
   */
  duration: number;
  /**
   * The ISO time for when the poll ends.
   */
  endsAt: number;
}

interface IPollEnd {
  /**
   * How many users ented the poll.
   */
  voters: number;
  /**
   * The responses for the poll.
   */
  responses: Array<{
    [answer: string]: number;
  }>;
}

interface IUserJoin {
  /**
   * The users Id.
   */
  id: number;
  /**
   * The users name.
   */
  username: string;
  /**
   * The roles the user has.
   */
  roles: string[];
}

interface IUserLeave {
  /**
   * The users Id.
   */
  id: number;
  /**
   * The users name.
   */
  username: string;
}

interface IDeleteMessage {
  /**
   * The message Id.
   */
  id: string;
}

export = BeamSocket;
