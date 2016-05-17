import Service = require("./service");

import { BeamRequest } from "../../defs/request";
import { IBeamUser } from "../../defs/user";
import { ITetrisGame, ITetrisVersion, ITetrisChannel } from "../../defs/tetris";

declare class GameService extends Service {
  /**
   * Joins the game for a specified channel ID.
   */
  join(channelId: number): Promise<BeamRequest<IJoinResponse>>; 
  /**
   * Gets a game from a specified game ID.
   */
  getGame(gameId: number): Promise<BeamRequest<ITetrisGame>>;
  /**
   * Updates a game from a specified game ID.
   */
  updateGame(gameId: number, data: {}): Promise<BeamRequest<ITetrisGame>>;
  /**
   * Deletes a game from a specified game ID.
   */
  deleteGame(gameId: number): Promise<any>;
  /**
   * Gets various information about a channel that is running an interactive game.
   */
  getChannelGame(channelId: number): Promise<BeamRequest<ITetrisChannel>>;
  /**
   * Gets all the games owned by a specific user ID.
   */
  ownedGames(userId: number): Promise<BeamRequest<BeamRequest<ITetrisGameVersioned[]>>>;
  /**
   * Gets a specific game and all its versions by a specific game ID and user ID.
   */
  ownedGameVersions(userId: number, gameId: number): Promise<BeamRequest<ITetrisGameVersioned>>;
  /**
   * Gets all the games that are published.
   */
  published(): Promise<ITetrisPublished[]>;
  /**
   * Creates a new tetris game.
   */
  create(data: { ownerId: number, name: string, description: string, installation: string }): Promise<BeamRequest<ITetrisGame>>;
  /**
   * Creates a new version of a game for a specific game ID and user ID.
   */
  createVersion(data: { ownerId: number, gameId: number, version: string, changelog: string, description: string, installation: string }): Promise<any>;
  /**
   * Updates a version of a game by specific version ID.
   */
  updateVersion(versionId: number, data: { gameId: number }): Promise<any>;
}

interface IJoinResponse {
  address: string;
  key: string;
}

interface ITetrisGameVersioned extends ITetrisGame {
  versions: ITetrisVersion[];
}

interface ITetrisPublished extends ITetrisGame {
  owner: IBeamUser;
}

export = GameService;