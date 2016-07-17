import querystring = require("querystring");
// noinspection TsLint
const pkg = require("../../package.json");

export class Utils {
  /**
   * Get the user agent to use when sending requests to Beam.
   */
  public static getUserAgent(): string {
        let client = `BeamClient/${pkg.version}`;
        if (typeof navigator !== "undefined") {
            return `${navigator.userAgent} ${client}`;
        }
        return `${client} (JavaScript; Node.js ${process.version})`;
    }

    /**
     * Builds a path to the Beam API by concating it with the address.
     */
    public static buildAddress(base: string, path: string, querystr?: {}): string {
        let url = base;

        // Strip any trailing slash from the base
        if (url.slice(-1) === "/") { url = url.slice(0, -1); }
        // And any leading slash from the path.
        if (path.charAt(0) === "/") { path = path.slice(1); }

        url = `${url}/${path}`;

        // And just add the query string
        if (querystr) { url += `?${querystring.encode(querystr)}`; }

        return url;
    }
}
