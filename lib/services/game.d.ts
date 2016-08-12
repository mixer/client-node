import Service = require("./service");

import { BeamRequest } from "../../defs/request";
import { BeamUser } from "../../defs/user";
import { TetrisGame, TetrisVersion, TetrisChannel } from "../../defs/tetris";

declare class GameService extends Service {
    /**
     * Joins the game for a specified channel ID.
     */
    join(channelId: number): Promise<BeamRequest<JoinResponse>>;

    /**
     * Gets a game from a specified game ID.
     */
    getGame(gameId: number): Promise<BeamRequest<TetrisGame>>;

    /**
     * Updates a game from a specified game ID.
     */
    updateGame(gameId: number, data: {}): Promise<BeamRequest<TetrisGame>>;

    /**
     * Deletes a game from a specified game ID.
     */
    deleteGame(gameId: number): Promise<any>;

    /**
     * Gets various information about a channel that is running an interactive game.
     */
    getChannelGame(channelId: number): Promise<BeamRequest<TetrisChannel>>;

    /**
     * Gets all the games owned by a specific user ID.
     */
    ownedGames(userId: number): Promise<BeamRequest<BeamRequest<TetrisGameVersioned[]>>>;

    /**
     * Gets a specific game and all its versions by a specific game ID and user ID.
     */
    ownedGameVersions(userId: number, gameId: number): Promise<BeamRequest<TetrisGameVersioned>>;

    /**
     * Gets all the games that are published.
     */
    published(): Promise<TetrisPublished[]>;

    /**
     * Creates a new tetris game.
     */
    create(data: { ownerId: number, name: string, description: string, installation: string }): Promise<BeamRequest<TetrisGame>>;

    /**
     * Creates a new version of a game for a specific game ID and user ID.
     */
    createVersion(data: { ownerId: number, gameId: number, version: string, changelog: string, description: string, installation: string }): Promise<any>;

    /**
     * Updates a version of a game by specific version ID.
     */
    updateVersion(versionId: number, data: { gameId: number }): Promise<any>;
}

interface JoinResponse {
    address: string;
    key: string;
}

interface TetrisGameVersioned extends TetrisGame {
    versions: TetrisVersion[];
}

interface TetrisPublished extends TetrisGame {
    owner: BeamUser;
}

export = GameService;
