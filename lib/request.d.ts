import * as request from "request";

declare const out: {
    run: request.RequestAPI<request.Request, request.Options, request.UriOptions>;
    restore: request.RequestAPI<request.Request, request.Options, request.UriOptions>;
};

export = out;
