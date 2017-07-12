import * as request from 'request';

export interface IOptionalUrlRequestOptions extends request.CoreOptions {
    url?: string;
}

export type IRequestOptions = request.CoreOptions & (request.UriOptions | request.UrlOptions);

export interface IRequestRunner {
    run(options: IRequestOptions): Promise<request.RequestResponse>;
}

export interface IResponse<T> extends request.RequestResponse {
    body: T;
}

/**
 * Default request runner.
 */
export class DefaultRequestRunner implements IRequestRunner {
    public run <T>(options: IRequestOptions & (request.UriOptions | request.UrlOptions)): Promise<IResponse<T>> {
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
