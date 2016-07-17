import Bluebird = require("bluebird");
import * as _ from "lodash";

import Provider from "./provider";
import { Client } from "../client";
import { Utils } from "../utils";

import Errors = require("../errors");

export default class OauthProvider extends Provider {
    private details: IClientDetails;
    private tokens: ITokens;

    constructor(private client: Client, options: IOauthOptions) {
        super();
        this.details = { client_id: options.clientId, client_secret: options.secret };
        this.setToken(options.tokens);
    }

    /**
     * Returns if the client is currently authenticated: they must have a non-expired key pair.
     */
    public isAuthenticated(): boolean {
        return this.tokens.access != null && this.tokens.expires.getTime() > Date.now();
    }

    /**
     * Returns a redirect to the web-page to get authentication.
     */
    public getRedirect(redirect: string, permissions: string | string[]): string {
        const params = {
            client_id: this.details.client_id,
            redirect_uri: redirect,
            response_type: "code",
            scope: typeof permissions === "string" ? permissions : permissions.join(" "),
        };
        return Utils.buildAddress(this.client.getUrl("frontend"), "/oauth/authorize", params);
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
     * Returns the date that the current tokens expire. You must refresh before then, or reauthenticate.
     */
    public expires(): Date {
        return this.tokens.expires;
    }

    /**
     * Returns the set of tokens. These can be saved and used to reload the provider later.
     */
    public getTokens(): ITokens {
        return this.tokens;
    }

    /**
     * Sets the tokens for the oauth provider.
     */
    public setToken(tokens: IStoredTokens): this {
        if (!tokens) {
            this.tokens = {} as ITokens;
        } else {
            this.tokens = {
                access: tokens.access,
                expires: new Date(tokens.expires),
                refresh: tokens.refresh,
            };
        }
        return this;
    }

    /**
     * Unpacks data from a token response.
     */
    public unpackResponse(res: any) {
        if (res.statusCode !== 200) {
            throw new Errors.AuthenticationFailedError(res);
        }
        this.tokens = {
            access: res.body.access_token,
            expires: new Date(Date.now() + (res.body.expires_in * 1000)),
            refresh: res.body.refresh_token,
        };
    }

    /**
     * Attempts to authenticate based on a query string, gotten from
     * redirecting back from the authorization url (see .getRedirect).
     *
     * Returns a promise which is rejected if there was an error
     * in obtaining authentication.
     */
    public attempt(redirect: string, qs: any): Bluebird<any> {
        return Bluebird.resolve()
            .then(() => {
                if (qs.error) {
                    throw new Errors.AuthenticationFailedError(qs.error_description || `Error from oauth: ${qs.error}`);
                }
                if (!qs.code) {
                    throw new Errors.AuthenticationFailedError("No error was given, " +
                        "but a code was not present in the query string. Make sure " +
                        "you\'re using the oauth client correctly.");
                }
                return this.client.request("post", "/oauth/token", {
                    form: _.extend({
                        code: qs.code,
                        grant_type: "authorization_code",
                        redirect_uri: redirect,
                    }, this.details),
                }).bind(this).then(this.unpackResponse);
            });
    }

    /**
     * Refreshes the authentication tokens, bumping the expires time.
     */
    public refresh(): Bluebird<any> {
        if (!this.tokens.refresh) {
            throw new Error("");
        }
        return this.client.request("post", "/oauth/token", {
            form: _.extend({
                grant_type: "refresh_token",
                refresh_token: this.tokens.refresh,
            }, this.details),
        }).bind(this).then(this.unpackResponse);
    }

    /**
     * Returns info to add to the clients request.
     */
    public getRequest(): Object {
        if (!this.isAuthenticated()) { return {}; }
        return {
            headers: {
                Authorization: `Bearer ${this.tokens.access}`,
            },
        };
    }
}

export interface IOauthOptions {
    clientId: string;
    secret: string;
    tokens?: IStoredTokens;
}

export interface IStoredTokens {
    access: string;
    refresh: string;
    expires: number;
}

export interface IClientDetails {
    client_id: string;
    client_secret: string;
}

export interface ITokens {
    access: string;
    refresh: string;
    expires: Date;
}
