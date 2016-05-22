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
  res: {};
}
declare class UnknownCodeError extends Error implements ResponseError {
  res: {};
  message: string;
}
declare class NotAuthenticatedError extends Error implements ResponseError { 
  res: {};
}

export { AuthenticationFailedError, BadMessageError, NoMethodHandlerError, ResponseError, UnknownCodeError, NotAuthenticatedError };
