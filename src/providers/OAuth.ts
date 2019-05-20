import { AuthenticationFailedError } from '@mixer/chat-client-websocket';
import { Client } from '../Client';
import { IResponse } from '../RequestRunner';
import { Provider } from './Provider';

export interface ITokenBase {
    access?: string;
    refresh?: string;
}

export interface ITokens extends ITokenBase {
    // ISO Date
    expires: string;
}

export interface IParsedTokens extends ITokenBase {
    expires?: Date;
}

export interface IOAuthProviderOptions {
    clientId: string;
    secret?: string;
    tokens?: ITokens;
}

interface IOAuthTokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

export interface IQueryAttemptQueryString {
    error: string;
    error_description: string;
    code: string;
}

/**
 * Provider for oauth-based authentication.
 */
export class OAuthProvider extends Provider {
    private details: {
        client_id: string;
        client_secret: string;
    };

    private tokens: IParsedTokens;

    constructor(client: Client, options: IOAuthProviderOptions) {
        super(client);
        this.details = { client_id: options.clientId, client_secret: options.secret };
        this.setTokens(options.tokens);
    }

    /**
     * Returns if the client is currently authenticated: they must
     * have a non-expired key pair.
     */
    public isAuthenticated(): boolean {
        return this.tokens.access !== undefined && this.tokens.expires.getTime() > Date.now();
    }

    /**
     * Returns a redirect to the webpage to get authentication.
     */
    public getRedirect(redirect: string, permissions: string | string[]): string {
        const params = {
            redirect_uri: redirect,
            response_type: 'code',
            scope: typeof permissions === 'string' ? permissions : permissions.join(' '),
            client_id: this.details.client_id,
        };

        return this.client.buildAddress(this.client.urls.public, '/oauth/authorize', params);
    }

    /**
     * Returns the access token, if any, or undefined.
     */
    public accessToken(): string {
        return this.tokens.access;
    }

    /**
     * Returns the refresh token, if any, or undefined.
     */
    public refreshToken(): string {
        return this.tokens.refresh;
    }

    /**
     * Returns the date that the current tokens expire. You must refresh
     * before then, or reauthenticate.
     */
    public expires(): Date {
        return this.tokens.expires;
    }

    /**
     * Returns the set of tokens. These can be saved and used to
     * reload the provider later using OAuthProvider.fromTokens.
     */
    public getTokens(): IParsedTokens {
        return this.tokens;
    }

    /**
     * Sets the tokens for the oauth provider.
     */
    public setTokens(tokens?: ITokens): this {
        if (!tokens) {
            this.tokens = {};
        } else {
            this.tokens = {
                access: tokens.access,
                refresh: tokens.refresh,
                expires: new Date(tokens.expires),
            };
        }

        return this;
    }

    /**
     * Unpacks data from a token response.
     */
    private unpackResponse(res: IResponse<IOAuthTokenResponse>): void {
        if (res.statusCode !== 200) {
            throw new AuthenticationFailedError(res);
        }

        this.tokens = {
            access: res.body.access_token,
            refresh: res.body.refresh_token,
            expires: new Date(Date.now() + res.body.expires_in * 1000),
        };
    }

    /**
     * Attempts to authenticate based on a query string, gotten from
     * redirecting back from the authorization url (see .getRedirect).
     *
     * Returns a promise which is rejected if there was an error
     * in obtaining authentication.
     */
    public attempt(redirect: string, qs: IQueryAttemptQueryString): Promise<void> {
        if (qs.error) {
            return Promise.reject(
                new AuthenticationFailedError(
                    qs.error_description || 'Error from oauth: ' + qs.error,
                ),
            );
        }

        if (!qs.code) {
            // XXX: https://github.com/prettier/prettier/issues/3804
            return Promise.reject(
                new AuthenticationFailedError(
                    'No error was given, but a code was not present in the query string. ' +
                        `Make sure you're using the oauth client correctly.`,
                ),
            ); // silly devlopers
        }

        return this.client
            .request<IOAuthTokenResponse>('post', '/oauth/token', {
                form: {
                    grant_type: 'authorization_code',
                    code: qs.code,
                    redirect_uri: redirect,
                    ...this.details,
                },
            })
            .then(res => this.unpackResponse(res));
    }

    /**
     * Refreshes the authentication tokens, bumping the expires time.
     */
    public refresh(): Promise<void> {
        if (!this.tokens.refresh) {
            return Promise.reject(
                new AuthenticationFailedError(
                    'Attempted to refresh without a refresh token present.',
                ),
            );
        }

        return this.client
            .request<IOAuthTokenResponse>('post', '/oauth/token', {
                form: {
                    grant_type: 'refresh_token',
                    refresh_token: this.tokens.refresh,
                    ...this.details,
                },
            })
            .then(res => this.unpackResponse(res));
    }

    /**
     * Returns info to add to the client's request.
     */
    public getRequest() {
        const headers: { [key: string]: string } = {
            'Client-ID': this.details.client_id,
        };

        if (this.isAuthenticated()) {
            headers['Authorization'] = `Bearer ${this.tokens.access}`;
        }

        return {
            headers,
        };
    }

    public getClientId() {
        return this.details.client_id;
    }
}
