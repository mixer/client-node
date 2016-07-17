import Bluebird = require("bluebird");

import Service = require("./service");
import { Client } from "../client";

import { ChannelPreferences, Channel } from "../../../defs/channel";
import { APIQuery, Request } from "../../../defs/beam";
import { Recording } from "../../../defs/recodings";

export class ChannelService extends Service {
    constructor(client: Client) {
        super(client);
    }

    /**
     * Retrieves a list of all channels, or a channel based on the filter passed to the API.
     */
    public all(filter?: APIQuery): Bluebird<Request<Channel[]>> {
        return this.makeHandled("get", "channels", filter);
    }

    /**
     * Retrieves channel data for channel specified by channel.
     */
    public getChannel(channel: string | number): Bluebird<Request<Channel>> {
        return this.makeHandled("get", `channels/${channel}`);
    }

    /**
     * Retrieves preferences for a channel specified by channelId.
     */
    public getPreferences(channelId: number): Bluebird<Request<ChannelPreferences>> {
        return this.makeHandled("get", `channels/${channelId}/preferences`);
    }

    /**
     * Retrieves the listing of recordings for a channel or single recording depending on the filter given.
     */
    public getRecordings(channelId: number, filter?: APIQuery): Bluebird<Request<Recording>> {
        return this.makeHandled("get", `channels/${channelId}/recordings`, filter);
    }
}
