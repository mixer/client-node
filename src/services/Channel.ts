import { IBroadcast, IChannel, IChannelPreferences } from '../defs/channel';
import { IResponse } from '../RequestRunner';
import { Service } from './Service';

/**
 * Service for interacting with the channel endpoints on the Mixer REST API.
 */
export class ChannelService extends Service {

    /**
     * Retrieves a list of all channels.
     */
    public all(data: { page: number; limit: number }): Promise<IResponse<IChannel[]>> {
        return this.makeHandled<IChannel[]>('get', 'channels', {
            qs: data,
        });
    }

    /**
     * Retrieves channel data for channel specified by channel.
     */
    public getChannel(channel: string | number): Promise<IResponse<IChannel>> {
        return this.makeHandled<IChannel>('get', `channels/${channel}`);
    }

    /**
     * Retrieves preferences for a channel specified by channelId
     */
    public getPreferences(channelId: number): Promise<IResponse<IChannelPreferences>> {
        return this.makeHandled<IChannelPreferences>('get', `channels/${channelId}/preferences`);
    }

    /**
     * Retrieves broadcast for a channel specified by channelId
     */
    public getBroadcast(channelId: number): Promise<IResponse<IBroadcast>> {
        return this.makeHandled<IBroadcast>('get', `channels/${channelId}/broadcast`);
    }
}
