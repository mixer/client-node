import Bluebird = require("bluebird");

export default class Provider {
    /**
     * Attempt to authenticate with Beam.
     */
    public attempt(...args: any[]): Bluebird<any> {
        throw new Error("Methods needs to be set by subclass.");
    }
    /**
     * Returns info to add to the client's request.
     */
    public getRequest(): Object {
        return {};
    }
}
