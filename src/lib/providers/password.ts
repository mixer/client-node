import Bluebird = require("bluebird");

import request = require("request");
import Errors = require("../errors");

import Provider from "./provider";
import { Client } from "../client";

import { Request } from "../../../defs/beam";
import { UserSelf } from "../../../defs/user";

export default class PasswordProvider extends Provider {
    /**
     * The cookie jar for the provider.
     */
    private jar: request.CookieJar = request.jar();
    /**
     * The options for the client.
     */
    private auth: IPasswordOptions;
    /**
     *
     * @param client
     * @param options
     */
    constructor(private client: Client, options: IPasswordOptions) {
        super();
        this.jar = request.jar();
        this.auth = options;
    }
    /**
     * Attempts to authenticate with the given details. Resolves with user information if correct.
     */
    public attempt(): Bluebird<Request<UserSelf>> {
        return this.client.request("post", "/users/login", {
                form: this.auth,
            })
            .then(res => {
                if (res.statusCode !== 200) {
                    throw new Errors.AuthenticationFailedError(res);
                }
                return res;
            });
    }

    /**
     * Returns info to add to the client's request.
     */
    public getRequest(): Object {
        return { jar: this.jar };
    }
}

export interface IPasswordOptions {
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
