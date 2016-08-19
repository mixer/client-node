import Service = require("./service");

import { BeamRequest } from "../../defs/request";
import { BeamUser } from "../../defs/user";
import { BeamChannelUser, ChannelUser, ChannelPreferences } from "../../defs/channel";

declare class ChannelService extends Service {
    /**
     * Retrieves a list of all channels.
     */
    all(data?: { page?: number, limit?: number }): Promise<BeamRequest<BeamChannelUser<BeamUser>[]>>;

    /**
     * Retrieves channel data for channel specified by channel.
     */
    getChannel(channelId: string | number): Promise<BeamRequest<BeamChannelUser<ChannelUser>>>;

    /**
     * Retrieves preferences for a channel specified by channelId.
     */
    getPreferences(channelId: number): Promise<BeamRequest<ChannelPreferences>>;
}

export = ChannelService;
