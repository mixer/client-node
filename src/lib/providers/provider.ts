import Bluebird = require("bluebird");

import { Request } from "../../../defs/beam";

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

    /**
     * Given a failing response from the client, processes the err object to look for a retry condition.
     * If a retry is warranted it returns true, otherwise false.
     */
    public handleResponseError(err: Request<any>, requestOptions?: [string, string, any]): Bluebird<any> {
        return Bluebird.reject(err);
    }
}
