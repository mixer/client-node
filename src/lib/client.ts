import Bluebird = require("bluebird");
import _  = require("lodash");
import request = require("./request");
import { UriOptions } from "request";

import Provider from "./providers/provider";
import PasswordProvider from "./providers/password";
import OauthProvider from "./providers/oauth";

import Services = require("./services");
import { ChannelService } from "./services/channel";
import { ChatService } from "./services/chat";
import { GameService } from "./services/game";

import { Utils } from "./utils";
import { TeamService } from "./services/team";
import { OauthOptions } from "./providers/oauth";
import { PasswordOptions } from "./providers/password";
import { Request } from "../../defs/beam";

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
    public use(provider: "password", options: PasswordOptions): PasswordProvider;
    public use(provider: "oauth", options: OauthOptions): OauthProvider;
    public use(provider: Providers, options: any): any;
    public use(provider: string, options: any): any {
        let AuthProvider = require(`./providers/${provider}`).default;
        this.provider = new AuthProvider(this, options);
        return this.provider;
    }

    /**
     * Returns the associated provider instance, as set by the `use` method.
     */
    public getProvider() {
        return this.provider;
    }

    /**
     * Set the provider to another provider which has already been created.
     */
    public setProvider(provider: Provider): this {
        this.provider = provider;
        return this;
    }

    /**
     * Attempts to run a given request to the Beam API.
     */
    public request<T>(method: Methods, path: string, data?: any): Bluebird<Request<T>> {
        let self = this;
        let url = Utils.buildAddress(this.urls.api, path);
        let options = _.extend({
                method,
                url,
                headers: {
                    "User-Agent": this.userAgent,
                },
                json: true,
            },
            this.provider ? this.provider.getRequest() : {}
        );
        let req = _.defaultsDeep(data || {}, options) as UriOptions;

        return new Bluebird<Request<T>>(
            (resolve, reject) => {
                request.run(req, (err, res, body) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(_.merge(res, { body, statusCode: res.statusCode }));
                });
            })
            .catch(err => {
                if (self.provider) {
                    self.provider.handleResponseError(err, [method, path, data]);
                }
                throw err;
            });
    }
}

export type URLType = "api" | "frontend";
export type Providers = "password" | "oauth";
export type Methods = "get" | "put" | "post" | "delete";
