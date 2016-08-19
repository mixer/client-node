declare class AuthenticationFailedError extends Error {
    message: string;
}
declare class BadMessageError extends Error {
    message: string;
}
declare class NoMethodHandlerError extends Error {
    message: string;
}
declare class ResponseError extends Error {
    res: any;
}
declare class UnknownCodeError extends Error implements ResponseError {
    res: any;
    message: string;
}
declare class NotAuthenticatedError extends Error implements ResponseError {
    res: any;
}

export {
    AuthenticationFailedError,
    BadMessageError,
    NoMethodHandlerError,
    ResponseError,
    UnknownCodeError,
    NotAuthenticatedError
};
