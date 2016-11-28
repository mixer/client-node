import { Client } from '../Client';
import { AuthenticationFailedError } from '../errors';
import { DefaultRequestRunner, IRequestOptions, IRequestRunner } from '../RequestRunner';
import { Provider } from './Provider';
import http from 'http';

export interface IPasswordProviderOptions {
    username: string;
    password: string;
    code?: string; // 2fa code
}

/**
 * Provider for password-based authentication.
 */
export class PasswordProvider extends Provider {

    public static CSRF_TOKEN_LOCATION = 'x-csrf-token';
    public static INVALID_CSRF_CODE = 461;

    private csrfToken: string;
    private jar: request.Jar;
    constructor (
        client: Client,
        private auth: IPasswordProviderOptions,
        private requestRunner: IRequestRunner = new DefaultRequestRunner()
    ) {
        super(client);
        this.jar = requestRunner.jar();
    }

    /**
     * Attempts to authenticate with the given details. Resolves
     * with user information if correct.
     */
    public attempt (): Promise<void> {
        return this.requestRunner.run({
            method: 'post',
            url: '/users/login',
            form: this.auth,
        })
        .then(res => {
            if (res.statusCode !== 200) {
                throw new AuthenticationFailedError(res);
            }
            this.csrfToken = res.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
        });
    };

    /**
     * Returns info to add to the client's request.
     */
    public getRequest () {
        return {
            jar: this.jar,
            headers: {
                [PasswordProvider.CSRF_TOKEN_LOCATION]: this.csrfToken,
            },
        };
    };

    public handleResponseError (err: http.IncomingMessage, requestOptions: IRequestOptions): Promise<http.IncomingMessage> {
        if (err.statusCode === PasswordProvider.INVALID_CSRF_CODE) {
            if (err.headers[PasswordProvider.CSRF_TOKEN_LOCATION] !== this.csrfToken) {
                this.csrfToken = err.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
                return this.client.request(requestOptions.method, requestOptions.baseUrl, requestOptions);
            }
        }
        return Promise.reject(err);
    };
}
