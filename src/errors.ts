import { IncomingMessage } from 'http';

/**
 * Base error for all fe2 stuff.
 * This also acts as a polyfill when building with ES5 target.
 */
export abstract class BeamClientError extends Error {
    constructor (public readonly message: string) {
        super();
        if (Error.captureStackTrace) { // chrome etc.
            Error.captureStackTrace(this, this.constructor);
            return;
        }
        const stack = new Error().stack.split('\n'); // removes useless stack frame
        stack.splice(1, 1);
        this.stack = stack.join('\n');
    }
}

/**
 * Emitted by our WebSocket when we get a bad packet; one that is binary,
 * we can't decode, or has a type we don't know about.
 */
export class BadMessageError extends BeamClientError {}

/**
 * Emitted by our WebSocket when we get get a "reply" to a method
 * that we don't have a handler for.
 */
export class NoMethodHandlerError extends BeamClientError {}

/**
 * Basic "response" error message from which others inherit.
 */
export abstract class ResponseError extends BeamClientError {
    constructor (public res: IncomingMessage | string) {
        super('Response error');
    }
}

/**
 * Emitted when we try to connect to the Beam API, but have invalid
 * credentials.
 */
export class AuthenticationFailedError extends ResponseError {
    public message: string = 'Authentication has failed';
}

/**
 * Happens when we get a code from the API that we don't expect.
 */
export class UnknownCodeError extends ResponseError {
    public message = 'An unknown error occurred';
}

/**
 * Happens when we attempt to access a point that needs authentication
 * or access that we don't have.
 */
export class NotAuthenticatedError extends ResponseError {
    public message = 'You do not have permission to view this.';
}
