import * as request from "request";

import Client = require("../client");

import { BeamRequest } from "../../defs/request";
import { BeamUserSelf } from "../../defs/user";

import Provider = require("./provider");

declare class PasswordProvider extends Provider {
  static CSRF_TOKEN_LOCATION: String;
  static INVALID_CSRF_CODE: Number;
  /**
   * The cookie jar for the provider.
   */
  jar: request.CookieJar;
  /**
   * Storage of the CSRF Token as given in the response from the server
   * @type {String}
   */
  csrfToken: String;
  /**
   * The options for the client.
   */
  auth: PasswordOptions;
  /**
   * Create a new instance of the provider.
   */
  constructor(client: Client, options: PasswordOptions);
  /**
   * Attempts to authenticate with the given details. Resolves with user information if correct.
   */
  attempt(): Promise<BeamRequest<BeamUserSelf>>;
}

interface PasswordOptions {
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
