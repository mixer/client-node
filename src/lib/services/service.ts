import Bluebird = require("bluebird");

import { Client, Methods } from "../client";
import Errors = require("../errors");

class Service {
    constructor(private client: Client) {}

    /**
     * Takes a response. If the status code isn't 200, attempt to find an
     * error handler for it or throw unknown error. If it's all good,
     * we return the response synchronously.
     */
    public handleResponse(res: any, handlers: any) {
        if (res.statusCode === 200) {
            return res;
        }

        let Handler = handlers && handlers[res.statusCode];
        if (!Handler) {
            Handler = Errors.UnknownCodeError;
        }
        throw new Handler(res);
    }

    /**
     * Simple wrapper that makes and handles a response in one go.
     */
    public makeHandled(method: Methods, path: string, data: any = {}, handlers: any = {}): Bluebird<any> {
        return this.client.request(method, path, data).bind(this).then(res => {
            return this.handleResponse(res, handlers);
        });
    }
}

export = Service;
