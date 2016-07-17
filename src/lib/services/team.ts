import Bluebird = require("bluebird");

import Service = require("./service");
import { Client } from "../client";

import { APIQuery, Request } from "../../../defs/beam";
import { Team, TeamDetails } from "../../../defs/team";

export class TeamService extends Service {
    constructor(client: Client) {
        super(client);
    }

    /**
     * Retrieves a list of all teams, or a team based on the filter passed to the API.
     */
    public all(filter?: APIQuery): Bluebird<Request<Team[]>> {
        return this.makeHandled("get", "teams", filter);
    }

    /**
     * Retrieves team data for channel specified by team.
     */
    public getTeam(team: string | number): Bluebird<Request<TeamDetails>> {
        return this.makeHandled("get", `teams/${team}`);
    }

    /**
     * Retrieves the members for a team.
     */
    public getMembers(team: number, filter?: APIQuery): Bluebird<Request<TeamDetails>> {
        return this.makeHandled("get", `teams/${team}/users`, filter);
    }

    /**
     * Accepts an invite to a team.
     */
    public acceptInvite(team: number, userId: number): Bluebird<Request<TeamDetails>>  {
        return this.makeHandled("put", `teams/${team}/users/${userId}`);
    }

    /**
     * Invite (add) a member to a team.
     */
    public addMember(team: number, userId: number): Bluebird<Request<TeamDetails>> {
        return this.makeHandled("post", `teams/${team}/users`, { userId });
    }

    /**
     * Kick (remove) a user from the team. This also supports a user leaving a team.
     */
    public removeMember(team: number, userId: number): Bluebird<Request<TeamDetails>> {
        return this.makeHandled("delete", `teams/${team}/users/${userId}`);
    }
}
