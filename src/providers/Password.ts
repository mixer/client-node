import { jar, Options } from 'request';
import { Client } from '../Client';
import { AuthenticationFailedError } from '../errors';
import { IResponse } from '../RequestRunner';
import { Provider } from './Provider';

/**
 * Provider for password-based authentication.
 */
export class PasswordProvider extends Provider {
    // storage of the CSRF Token as given in the response from the server
    private csrfToken: string;
    private jar: any;
    constructor(client: Client, private options: { username: string, password: string, code?: string }) {
        super(client);
        // Jar for storing the session cookie
        this.jar = jar();
    }

    public static CSRF_TOKEN_LOCATION = 'x-csrf-token';
    public static INVALID_CSRF_CODE = 461;

    /**
     * Attempts to authenticate with the given details. Resolves
     * with user information if correct.
     */
    public attempt(): Promise<void> {
        return this.client.request<void>('post', '/users/login', { form: this.options })
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
    public getRequest() {
        const req = {
            jar: this.jar,
            headers: <{
                [key: string]: string;
            }>{},
        };
        req.headers[PasswordProvider.CSRF_TOKEN_LOCATION] = this.csrfToken;
        return req;
    };

    public handleResponseError(err: IResponse<any>, requestOption: Options) {
        if (err.statusCode === PasswordProvider.INVALID_CSRF_CODE) {
            if (err.headers[PasswordProvider.CSRF_TOKEN_LOCATION] !== this.csrfToken) {
                this.csrfToken = err.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
                return this.client.request.apply(this.client, requestOption);
            }
        }
        return Promise.reject(err);
    };
}
