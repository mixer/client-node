import Client = require("../client");

import { BeamRequest } from "../../defs/request";
import { OAuthToken } from "../../defs/oauth";
import Provider = require("./provider");

declare class OAuthProvider extends Provider {
    /**
     * The client tokens.
     */
    tokens: OAuthOptions;
    /**
     * The details for the OAuthProvider.
     */
    details: { client_id: string, client_secret: string };

    /**
     * Create a new instance of the provider.
     */
    constructor(client: Client, options: OAuthOptions);

    /**
     * Returns if the client is currently authenticated: they must have a non-expired key pair.
     */
    isAuthenticated(): boolean;

    /**
     * Returns a redirect to the webpage to get authentication.
     */
    getRedirect(redirect: string, permissions: string[]): string;

    /**
     * Returns the access token, if any, or undefined.
     */
    accessToken(): string;

    /**
     * Returns the refresh token, if any, or undefined.
     */
    refreshToken(): string;

    /**
     * Returns the date that the current tokens expire. You must refresh before then, or reauthenticate.
     */
    expires(): Date;

    /**
     * Returns the set of tokens. These can be saved and used to reload the provider later using OAuthProvider.fromTokens.
     */
    getTokens(): OAuthTokens;

    /**
     * Attempts to authenticate based on a query string, gotten from redirecting back from the authorization url (see .getRedirect).
     */
    attempt(redirect: string, queryStr: string): Promise<BeamRequest<OAuthToken>>;

    /**
     * Refreshes the authentication tokens, bumping the expires time.
     */
    refresh(): Promise<BeamRequest<OAuthToken>>;
}

declare interface OAuthOptions {
    /**
     * Your application client ID.
     */
    clientId: string;
    /**
     * Your secret token, if enabled.
     */
    secret?: string;
    /**
     * A stored set of tokens to reused for authentication.
     */
    tokens?: OAuthTokens;
}

declare interface OAuthTokens {
    access: string;
    refresh: string;
    expires: Date;
}

export = OAuthProvider;
