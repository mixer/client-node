namespace Errors {
    export class AuthenticationFailedError extends Error {
        constructor(public message: string = "Authentication has failed.") {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export class BadMessageError extends Error {
        constructor(public message: string) {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export class NoMethodHandlerError extends Error {
        constructor(public message: string) {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export class ResponseError extends Error {
        constructor(public response: any) {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export class UnknownCodeError extends Error {
        constructor(public message: string = "An unknown error occurred.") {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }

    export class NotAuthenticatedError extends Error {
        constructor(public message: string = "You do not have permission to view this.") {
            super();
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export = Errors;
