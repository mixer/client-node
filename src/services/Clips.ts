import { IClipProperties } from '../defs/clipProperties';
import { IClipRequest } from '../defs/clipRequest';
import { IResponse } from '../RequestRunner';
import { Service } from './Service';

/**
 * Service for interacting with clips on the Mixer REST API.
 */
export class ClipsService extends Service {

    /**
     * Can a clip be created on the given broadcast. Check the response code.
     * 200: can clip
     * 400-500: cannot clip
     */
    public canClip(broadcastId: string): Promise<IResponse<void>> {
        return this.makeHandled<void>('get', `clips/broadcasts/${broadcastId}/canClip`);
    }

    /**
     * Creates a clip.
     * 200: clip created
     * 400-500: cannot clip
     */
    public async createClip(p: IClipRequest): Promise<IResponse<void>> {
        return this.makeHandled<void>('post', `clips/create`, { body: p });
    }

    /**
     * Deletes a clip.
     * 202: clip deleted
     * 400-500: cannot delete clip
     */
    public async deleteClip(shareableId: string): Promise<IResponse<void>> {
        return this.makeHandled<void>('delete', `clips/delete/${shareableId}`);
    }

    /**
     * Gets a clip.
     */
    public getClip(shareableId: string): Promise<IResponse<IClipProperties>> {
        return this.makeHandled<IClipProperties>('get', `clips/${shareableId}`);
    }

    /**
     * Renames a clip.
     */
    public async renameClip(shareableId: string, newTitle: string): Promise<IResponse<IClipProperties>> {
        return this.makeHandled<IClipProperties>('post', `clips/${shareableId}/metadata`, { body: { title: newTitle } });
    }

    /**
     * Returns all clips for the channel.
     */
    public getClips(channelId: string): Promise<IResponse<IClipProperties[]>> {
        return this.makeHandled<IClipProperties[]>('get', `clips/channels/${channelId}`);
    }
}
