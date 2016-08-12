import Client = require("../client");

declare class Service {
    constructor();

    /**
     * Takes a response. If the status code isn't 200, attempt to find an error handler for it or throw unknown error.
     * If it's all good, we return the response synchronously.
     */
    protected handleResponse(res: any, handlers: {}): {};

    /**
     * Simple wrapper that makes and handles a response in one go.
     */
    protected makeHandled(method: string, path: string, data: {}, handlers: {}): Promise<any>;
}

export = Service;
