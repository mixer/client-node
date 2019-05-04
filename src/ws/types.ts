export const enum ErrorCode {
    Unknown = 4000,
    PurgeUserNotFound,
    PurgeNoPermissions,
    MessageNotFound,
    BadRequest,
    RateLimited,
    AuthServerError,
}

export const enum StringError {
    UserNotFound = 'UNOTFOUND',
    AccessDenied = 'UACCESS',
}

export interface IPacket {
    id: number;
    type: string;
    event: any;
    data: any;
    error: null | StringError | IErrorPacket;
}

export interface IErrorPacket {
    code: ErrorCode;
    message: string;
    stacktrace: string;
}
