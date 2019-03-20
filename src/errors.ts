import { IncomingMessage } from 'http';

// tslint:disable max-classes-per-file

export const UNOTFOUND = 'UNOTFOUND';
export const UACCESS = 'UACCESS';

export const enum ErrorCode {
    Unknown = 4000,
    PurgeUserNotFound,
    PurgeNoPermissions,
    MessageNotFound,
    BadRequest,
    RateLimited,
    AuthServerError,
}

/**
 * Base error for all fe2 stuff.
 * This also acts as a polyfill when building with ES5 target.
 */
export abstract class ClientError extends Error {
    constructor(public readonly message: string) {
        super();
        if (this.stack) {
            return;
        }
        if (Error.captureStackTrace) { // chrome etc.
            Error.captureStackTrace(this, this.constructor);
            return;
        }
        const stack = new Error().stack.split('\n'); // removes useless stack frame
        stack.splice(1, 1);
        this.stack = stack.join('\n');
    }

    protected static setProto(error: ClientError) {
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(error, this.prototype);
            return;
        }
        (<any>error).__proto__ = this.prototype; // Super emergency fallback
    }
}

/**
 * Emitted by our WebSocket when we get a bad packet; one that is binary,
 * we can't decode, or has a type we don't know about.
 */
export class BadMessageError extends ClientError {
    constructor(msg: string) {
        super(msg);
        BadMessageError.setProto(this);
    }
}

/**
 * Emitted by our WebSocket when we get get a "reply" to a method
 * that we don't have a handler for.
 */
export class NoMethodHandlerError extends ClientError {
    constructor(msg: string) {
        super(msg);
        NoMethodHandlerError.setProto(this);
    }
}

/**
 * Basic "response" error message from which others inherit.
 */
export abstract class ResponseError extends ClientError {
    constructor(public res: IncomingMessage | string) {
        super(typeof res === 'string' ? res : 'Response error');
    }
}

/**
 * Emitted when we try to connect to the Mixer API, but have invalid
 * credentials.
 */
export class AuthenticationFailedError extends ResponseError {
    constructor(res: IncomingMessage | string) {
        super(res);
        AuthenticationFailedError.setProto(this);
    }
}

/**
 * Happens when we get a code from the API that we don't expect.
 */
export class UnknownCodeError extends ResponseError {
    constructor() {
        super('An unknown error occurred');
        UnknownCodeError.setProto(this);
    }
}

/**
 * Happens when we attempt to access a point that needs authentication
 * or access that we don't have.
 */
export class NotAuthenticatedError extends ResponseError {
    constructor() {
        super('You do not have permission to view this.');
        NotAuthenticatedError.setProto(this);
    }
}

/**
 * A TimeoutError is thrown in call if we don't get a response from the
 * chat server within a certain interval.
 */
export class TimeoutError extends ClientError {
    constructor() {
        super('Timeout');
        TimeoutError.setProto(this);
    }
}
