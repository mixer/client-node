import Bluebird = require("bluebird");
import _  = require("lodash");
import request = require("./request");

import Provider from "./providers/provider";
import PasswordProvider from "./providers/password";
import OauthProvider from "./providers/oauth";

import Services = require("./services");
import { ChannelService } from "./services/channel";
import { ChatService } from "./services/chat";
import { GameService } from "./services/game";

import { Utils } from "./utils";
import { UriOptions } from "request";
import { TeamService } from "./services/team";

export class Client {
    // Services
    public channel: ChannelService;
    public chat: ChatService;
    public game: GameService;
    public team: TeamService;

    private provider: Provider = null;
    private userAgent: string = Utils.getUserAgent();
    private urls: {
        api: string;
        frontend: string;
    };

    constructor() {
        this.urls = {
            api: "https://beam.pro/api/v1",
            frontend: "https://beam.pro",
        };
        _.forIn(Services, (Service, key) => {
            this[key] = new Service(this);
        });
    }

    /**
     * Sets the API/Frontend URLs for the client.
     */
    public setUrl(type: URLType, url: string): void {
        this.urls[type] = url;
    }

    /**
     * Get a URL based on the type passed.
     */
    public getUrl(type: URLType): string {
        return this.urls[type];
    }

    /**
     * Creates and returns an authentication provider instance.
     */
    public use(provider: "password", options: PasswordOpts): PasswordProvider;
    public use(provider: "oauth", options: OAuthOpts): OauthProvider;
    public use(provider: Providers, options: any): any;
    public use(provider: string, options: any): any {
        let Provider = require(`./providers/${provider}`).default;
        this.provider = new Provider(this, options);
        return this.provider;
    }

    /**
     * Returns the associated provider instance, as set by the `use` method.
     */
    public getProvider() {
        return this.provider;
    }

    /**
     * Attempts to run a given request to the Beam API.
     */
    public request(method: Methods, path: string, data: any): Bluebird<any> {
        let url = Utils.buildAddress(this.urls.api, path);
        let req = _.defaultsDeep(data || {}, _.extend({
                method,
                url,
                headers: {
                    "User-Agent": this.userAgent,
                },
            },
            this.provider ? this.provider.getRequest() : {}
        )) as UriOptions;

        return new Bluebird((resolve, reject) => {
            request.run(req, (err, res, body) => {
                try { body = JSON.parse(body); } catch (e) { /* Ignore the error */ }
                if (err) {
                    reject(err);
                }
                resolve(_.merge(res, { body }));
            });
        });
    }
}

export type URLType = "api" | "frontend";
export type Providers = "password" | "oauth";
export type Methods = "get" | "put" | "post" | "delete";
export type PasswordOpts = { username: string, password: string, code?: number };
export type OAuthOpts = { clientId: string, secret: string, tokens?: {
    access: string, refresh: string, expires: number }};
