export interface IOAuthToken {
    /**
     * The access token which the client should use.
     */
    access_token: string;
    /**
     * The token type.
     */
    token_type: 'Bearer';
    /**
     * The time until the token expires.
     */
    expires_in: number;
    /**
     * The refresh token you should use to get a new token.
     */
    refresh_token: string;
}
