import { IClipProperties } from '../defs/clipProperties';
import { IClipRequest } from '../defs/clipRequest';
import { IResponse } from '../RequestRunner';
import { Service } from './Service';

/**
 * Service for interacting with clips on the Mixer REST API.
 */
export class ClipsService extends Service {

    /**
     * Can a clip be created on the given broadcast.
     */
    public async canClip(broadcastId: string): Promise<boolean> {
        try {
            await this.makeHandled<boolean>('get', `clips/broadcasts/${broadcastId}/canClip`);
        } catch {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    }

    /**
     * Creates a clip.
     */
    public async createClip(p: IClipRequest): Promise<boolean> {
        try {
            await this.makeHandled<boolean>('post', `clips/create`, { body: p });
        } catch {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    }

    /**
     * Deletes a clip.
     */
    public async deleteClip(shareableId: string): Promise<boolean> {
        try {
            await this.makeHandled<boolean>('delete', `clips/delete/${shareableId}`);
        } catch {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
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
    public async renameClip(shareableId: string, newTitle: string): Promise<boolean> {
        try {
            await this.makeHandled<IClipProperties>('post', `clips/${shareableId}/metadata`, { body: { title: newTitle } });
        } catch {
            return Promise.resolve(false);
        }

        return Promise.resolve(true);
    }

    /**
     * Returns all clips for the channel.
     */
    public getClips(channelId: string): Promise<IResponse<IClipProperties[]>> {
        return this.makeHandled<IClipProperties[]>('get', `clips/channels/${channelId}`);
    }
}
