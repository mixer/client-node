import Bluebird = require("bluebird");

import request = require("request");
import Errors = require("../errors");

import Provider from "./provider";
import { Client } from "../client";

import { Request } from "../../../defs/beam";
import { UserSelf } from "../../../defs/user";
import { RequestAPI } from "request";

export default class PasswordProvider extends Provider {
    /**
     * Header location for the token sent a response from the API.
     */
    public static CSRF_TOKEN_LOCATION = "x-csrf-token";
    /**
     * Error code thrown from the API if an invalid / no CSRF was sent.
     */
    public static INVALID_CSRF_CODE = 461;
    /**
     * The cookie jar for the provider.
     */
    private jar: request.CookieJar = request.jar();
    /**
     * The options for the client.
     */
    private auth: PasswordOptions;
    /**
     * The CSRF token.
     */
    private csrfToken: string = null;
    /**
     *
     * @param client
     * @param options
     */
    constructor(private client: Client, options: PasswordOptions) {
        super();
        this.jar = request.jar();
        this.auth = options;
    }
    /**
     * Attempts to authenticate with the given details. Resolves with user information if correct.
     */
    public attempt(): Bluebird<Request<UserSelf>> {
        const self = this;
        return this.client.request<UserSelf>("post", "/users/login", {
                form: this.auth,
            })
            .then(res => {
                if (res.statusCode !== 200) {
                    throw new Errors.AuthenticationFailedError(<any> res);
                }
                self.csrfToken = res.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
                return res;
            });
    }

    /**
     * Set the CSRF token to be used in all requests with this provider.
     */
    public setCSRFToken(token: string) {
        this.csrfToken = token;
    }

    /**
     * Returns info to add to the client's request.
     */
    public getRequest(): Object {
        let req = {
            headers: {},
            jar: this.jar,
        };
        req.headers[PasswordProvider.CSRF_TOKEN_LOCATION] = this.csrfToken;
        return req;
    }

    /**
     * Handle response errors from requests.
     */
    public handleResponseError(err: Request<any>, requestOpts: [string, string, any]): Bluebird<any> {
        if (err.statusCode === PasswordProvider.INVALID_CSRF_CODE) {
            if (err.headers[PasswordProvider.CSRF_TOKEN_LOCATION] !== this.csrfToken) {
                this.csrfToken = err.headers[PasswordProvider.CSRF_TOKEN_LOCATION];
                return this.client.request.apply(this.client, requestOpts);
            }
        }
        return Bluebird.reject(err);
    }
}

export interface PasswordOptions {
    /**
     * Username of whoever is logging in...
     */
    username: string;
    /**
     * Their password...
     */
    password: string;
    /**
     * The user two factor auth code, necessary if they have 2fa enabled.
     */
    code?: number;
}
