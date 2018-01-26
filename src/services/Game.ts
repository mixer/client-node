import { IGame, IInteractiveChannel, IVersion } from '../defs/interactive';
import { IUser } from '../defs/user';
import { IResponse } from '../RequestRunner';
import { Service } from '../services/Service';

export interface IJoinResponse {
    address: string;
    key: string;
}

export interface IGameVersioned extends IGame {
    versions: IVersion[];
}

export interface IPublished extends IGame {
    owner: IUser;
}

/**
 * Service for interacting with the game endpoints on the Mixer REST API.
 */
export class GameService extends Service {

    /**
     * Joins the game for a specified channel ID.
     */
    public join(channelId: number): Promise<IResponse<IJoinResponse>> {
        return this.makeHandled<IJoinResponse>('get', `interactive/${channelId}/robot`);
    }

    /**
     * Gets a game from a specified game ID.
     */
    public getGame(gameId: number): Promise<IResponse<IGame>> {
        return this.makeHandled<IGame>('get', `interactive/games/${gameId}`);
    }

    /**
     * Updates a game from a specified game ID.
     */
    public updateGame(gameId: number, data: Partial<IGame>): Promise<IResponse<IGame>> {
        return this.makeHandled<IGame>('put', `interactive/games/${gameId}`, {
            body: data,
        });
    }

    /**
     * Deletes a game from a specified game ID.
     */
    public deleteGame(gameId: number): Promise<IResponse<void>> {
        return this.makeHandled<void>('delete', `interactive/games/${gameId}`);
    }

    /**
     * Gets various information about a channel that is running an interactive game.
     */
    public getChannelGame(channelId: number): Promise<IResponse<IInteractiveChannel>> {
        return this.makeHandled<IInteractiveChannel>('get', `interactive/${channelId}`);
    }

    /**
     * Gets all the games owned by a specific user ID.
     */
    public ownedGames(userId: number): Promise<IResponse<IGameVersioned>> {
        return this.makeHandled<IGameVersioned>('get', `interactive/games/owned?user=${userId}`);
    }

    /**
     * Gets a specific game and all its versions by a specific game ID and user ID.
     */
    public ownedGameVersions(userId: number, gameId: number): Promise<IResponse<IGameVersioned>> {
        return this.makeHandled<IGameVersioned>('get', `interactive/games/owned?user=${userId}&where=id.eq.${gameId}`);
    }

    /**
     * Gets all the games that are published.
     */
    public published() {
        return this.makeHandled('get', 'interactive/games');
    }

    /**
     * Creates a new interactive game.
     */
    public create(data: Pick<IGame, 'ownerId' | 'name' | 'description' | 'installation'>): Promise<IResponse<IGame>> {
        return this.makeHandled<IGame>('post', 'interactive/games', {
            body: data,
        });
    }

    /**
     * Creates a new version of a game for a specific game ID and user ID.
     */
    public createVersion(
        data: Pick<IVersion, 'gameId' | 'version' | 'changelog' | 'installation' | 'download' | 'controls'>,
    ): Promise<IResponse<IVersion>> {
        return this.makeHandled<IVersion>('post', 'interactive/versions', {
            body: data,
        });
    }

    /**
     * Updates a version of a game by specific version ID.
     */
    public updateVersion(
        versionId: number,
        data: Pick<IVersion, 'version' | 'changelog' | 'installation' | 'download' | 'controls'>,
    ): Promise<IResponse<IVersion>> {
        return this.makeHandled<IVersion>('put', `interactive/versions/${versionId}`, {
            body: data,
        });
    }
}
