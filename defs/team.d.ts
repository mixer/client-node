import { Social } from "./beam";

export interface Team {
    /**
     * Social links for the user. (Note: The social object can be null)
     */
    social: Social;
    /**
     * The Id of the team.
     */
    id: number;
    /**
     * The user Id of the user account which is the owner of the team.
     */
    ownerId: number;
    /**
     * The token of the team.
     */
    token: string;
    /**
     * The name of the team.
     */
    name: string;
    /**
     * The description for the team.
     */
    description: string;
    /**
     * The logo for the team.
     */
    logoUrl: string;
    /**
     * The background for the team.
     */
    backgroundUrl: string;
    /**
     * The amount of viewers collectedly watching people who are in the team.
     */
    totalViewersCurrent: number;
}

export interface TeamDetails extends Team {
    /**
     * The timestamp of when the team was created.
     */
    createdAt: string;
    /**
     * The timestamp of when the team was last updated.
     */
    updatedAt: string;
}
