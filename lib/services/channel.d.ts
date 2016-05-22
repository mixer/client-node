import Service = require("./service");

import { BeamRequest } from "../../defs/request";
import { IBeamUser } from "../../defs/user";
import { IBeamChannelUser, IChannelUser, IChannelPreferences } from "../../defs/channel";

declare class ChannelService extends Service {
  /**
   * Retrieves a list of all channels.
   */
  all(data?: { page?: number, limit?: number }): Promise<BeamRequest<IBeamChannelUser<IBeamUser>[]>>;
  /**
   * Retrieves channel data for channel specified by channel.
   */
  getChannel(channelId: string | number): Promise<BeamRequest<IBeamChannelUser<IChannelUser>>>;
  /**
   * Retrieves preferences for a channel specified by channelId.
   */
  getPreferences(channelId: number): Promise<BeamRequest<IChannelPreferences>>;
}

export = ChannelService;
