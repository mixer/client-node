import Bluebird = require("bluebird");

import Service = require("./service");
import { Client } from "../client";

import { Request } from "../../../defs/beam";
import { TetrisGame, TetrisChannel, TetrisVersion } from "../../../defs/tetris";
import { User } from "../../../defs/user";

export class GameService extends Service {
    constructor(client: Client) {
        super(client);
    }

    /**
     * Get the connection information to join the Tetris socket for a channel.
     */
    public join(channelId: number): Bluebird<Request<ITetrisJoin>> {
        return this.makeHandled("get", `tetris/${channelId}/robot`);
    }

    /**
     * Gets a game from a specified game Id.
     */
    public getGame(gameId: number): Bluebird<Request<TetrisGame>> {
        return this.makeHandled("get", `tetris/games/${gameId}`);
    }

    /**
     * Updates a game from a specified game Id.
     */
    public updateGame(gameId: number, data: any): Bluebird<Request<TetrisGame>> {
        return this.makeHandled("put", `tetris/games/${gameId}`, data);
    }

    /**
     * Deletes a game from a specified game Id.
     */
    public deleteGame(gameId: number): Bluebird<any> {
        return this.makeHandled("delete", `tetris/games/${gameId}`);
    }

    /**
     * Gets various information about a channel that is running an interactive game.
     */
    public getChannelGame(channelId: number): Bluebird<Request<TetrisChannel>> {
        return this.makeHandled("get", `tetris/${channelId}`);
    }

    /**
     * Gets all the games owned by a specific user Id.
     */
    public ownedGames(userId: number): Bluebird<Request<IGameVersioned[]>> {
        return this.makeHandled("get", `tetris/games/owned?user=${userId}`);
    }

    /**
     * Gets a specific game and all its versions by a specific game Id and user Id.
     */
    public ownedGameVersions(userId: number, gameId: number): Bluebird<Request<IGameVersioned>> {
        return this.makeHandled("get", `tetris/games/owned?user=${userId}&where=id.eq.${gameId}`);
    }

    /**
     * Gets all the games that are published.
     */
    public getPublished(): Bluebird<Request<IGamesPublished>> {
        return this.makeHandled("get", "tetris/games");
    }

    /**
     * Creates a new tetris game.
     */
    public create(data: any): Bluebird<Request<TetrisGame>> {
        return this.makeHandled("post", "tetris/games", data);
    }

    /**
     * Creates a new version of a game for a specific game Id and user Id.
     */
    public createVersion(data: any): Bluebird<Request<any>> {
        return this.makeHandled("post", "tetris/versions", data);
    }

    /**
     * Updates a version of a game by specific version Id.
     */
    public updateVersion(versionId: number, data: any): Bluebird<any> {
        return this.makeHandled("put", `tetris/versions/${versionId}`, data);
    }
}

export interface ITetrisJoin {
    address: string;
    key: string;
}

export interface IGameVersioned extends TetrisGame {
    versions: TetrisVersion[];
}

export interface IGamesPublished extends TetrisGame {
    owner: User;
}
