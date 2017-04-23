import { Client } from '../Client';
import { IRequestOptions } from '../RequestRunner';
import http from 'http';

export abstract class Provider {
    constructor (protected client: Client) {}

    public abstract attempt (...args: any[]): Promise<void>;
    /**
     * Returns info to add to the client's request.
     */
    public getRequest (): Object {
        return {};
    }

    /**
     * Given a failing response from the client, processes the error object and returns a Promise
     * which allows for a provider to retry a request or carry out some other process
     */
    public handleResponseError (err: http.IncomingMessage, _requestOptions: IRequestOptions): Promise<http.IncomingMessage> {
        return Promise.reject(err);
    }
}
