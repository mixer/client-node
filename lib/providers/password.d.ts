import * as request from "request";

import Client = require("../client");

import { BeamRequest } from "../../defs/request";
import { IBeamUserSelf } from "../../defs/user";

declare class PasswordProvider {
  /**
   * The cookie jar for the provider.
   */
  jar: request.CookieJar;
  /**
   * The options for the client.
   */
  auth: IPasswordOptions;
  /**
   * Create a new instance of the provider.
   */
  constructor(client: Client, options: IPasswordOptions);
  /**
   * Attempts to authenticate with the given details. Resolves with user information if correct.
   */
  attempt(): Promise<BeamRequest<IBeamUserSelf>>;
}

interface IPasswordOptions {
  /**
   * Username of whoever is logging in...
   */
  username: string;
  /**
   * Their password...
   */
  password: string;
  /**
   * The user two factor auth code, necessary if they have 2fa enabled.
   */
  code?: number;
}

export = PasswordProvider;
