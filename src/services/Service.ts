import { Client } from '../Client';
import { UnknownCodeError } from '../errors';
import { IOptionalUrlRequestOptions, IResponse } from '../RequestRunner';

export interface ICtor {
    new (msg: any): void;
}

const apiVerRegex = /^v[0-9]\//;

/**
 * A service is basically a bridge/handler function for various endpoints.
 * It can be passed into the client and used magically.
 */
export class Service {
    constructor(private client: Client) {}

    /**
     * Takes a response. If the status code isn't 200, attempt to find an
     * error handler for it or throw unknown error. If it's all good,
     * we return the response synchronously.
     */
    protected handleResponse(res: IResponse<any>, handlers?: { [key: string]: ICtor }) {
        // 200 codes are already great!
        if (res.statusCode === 200) {
            return res;
        }

        // Otherwise, we have to handle it.
        let handler = handlers && handlers[res.statusCode];
        if (!handler) {
            handler = <ICtor>UnknownCodeError;
        }

        throw new handler(res);
    }

    /**
     * Simple wrapper that makes and handles a response in one go.
     */
    protected makeHandled<T>(
        method: string,
        path: string,
        data?: IOptionalUrlRequestOptions,
        handlers?: { [key: string]: ICtor },
    ): Promise<IResponse<T>> {
        let apiVersion: string;
        if (apiVerRegex.test(path)) {
            apiVersion = path.match(apiVerRegex)[0].slice(0, -1);
            path = path.slice(3);
        }
        return this.client.request(method, path, data, apiVersion)
        .then(res => this.handleResponse(res, handlers));
    }
}
