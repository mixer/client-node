import ChannelService = require("./services/channel");
import ChatService = require("./services/chat");
import GameService = require("./services/game");

import OAuthProvider = require("./providers/oauth");
import PasswordProvider = require("./providers/password");

declare class Client {
    /**
     * The user agent for the Beam client.
     */
    userAgent: string;
    /**
     * The urls for the client.
     */
    urls: {
        api: string;
        public: string;
    };
    /**
     * The services the client supports.
     */
    channel: ChannelService;
    chat: ChatService;
    game: GameService;

    /**
     * Sets the the API/public URLs for the client.
     */
    setUrl(type: "api" | "public", url: string): this;

    /**
     * Builds a path to the Beam API by concating it with the address.
     */
    private buildAddress(base: string, path: string, queryStr: string): string;

    /**
     * Creates and returns an authentication provider instance.
     */
    use(provider: "oauth" | "password", options: {}): any;
    use(provider: "oauth", options: { clientId: string, secret?: string, tokens?: {} }): OAuthProvider;
    use(provider: "password", options: { username: string, password: string, code?: number }): PasswordProvider;

    /**
     * Returns the associated provider instance, as set by the `use` method.
     */
    getProvider(): OAuthProvider | PasswordProvider;

    /**
     * Attempts to run a given request.
     */
    request(method: string, path: string, data: {}): Promise<any>;
}

export = Client;
