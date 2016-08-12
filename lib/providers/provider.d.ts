import Client = require("../client");

declare class Provider {
    /**
     * Create a new instance of the provider.
     */
    constructor(client: Client);

    /**
     * Returns info to add to the client's request.
     */
    getRequest(): any;

    /**
     * Given a failing response from the client, processes the error object and returns a Promise
     * which allows for a provider to retry a request or carry out some other process
     */
    handleResponseError(): Promise<void>;

    /**
     * Attempts to authenticate with the given details. Resolves with user information if correct.
     */
    attempt(...args: any[]): Promise<any>;
}

export = Provider;
