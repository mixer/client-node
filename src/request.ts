import http from 'http';
import * as request from 'request';

export type IRequestOptions = (request.UriOptions | request.UrlOptions) & request.CoreOptions;

export interface IRequestRunner {
    run (options: IRequestOptions) : Promise<http.IncomingMessage>;
}

// Default request runner.
export class DefaultRequestRunner implements IRequestRunner {
    public run (options: IRequestOptions): Promise<http.IncomingMessage> {
        return new Promise((resolve, reject) => {
            request(options, (error, response) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(response);
            });
        });
    }
}
