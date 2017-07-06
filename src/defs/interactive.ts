export interface IInteractiveChannel {
    /**
     * The Interactive WebSocket address to connect too.
     */
    address: string;
    /**
     * The authKey to use for the session.
     */
    key: string;
    /**
     * The userId of the current user.
     */
    user: number;
    /**
     * The influence the user has on the controls.
     */
    influence: number;
    /**
     * Version information about the game and controls schema.
     */
    version: IChannelVersion;
}

export interface IVersion {
    /**
     * The Id of the version.
     */
    id: number;

    /**
     * The Id of the game.
     */
    gameId: number;
    /**
     * The game version.
     */
    version: string;
    /**
     * The state of the version.
     */
    state: 'published' | 'draft' | 'pending';
    /**
     * Number to allow easy ordering of versions.
     */
    versionOrder: number;
    /**
     * Installation guide for the version.
     */
    installation: string;
    /**
     * The download link for the version.
     */
    download: string;
    /**
     * Time of when the version was created.
     */
    createdAt: string;
    /**
     * Time of when the version was updated.
     */
    updatedAt: string;
    /**
     * The interactive game being using.
     */
    game: IGame;

    /**
     * The changelog.
     */
    changelog: string;

    /**
     * The controls.
     */
    controls: IControls;
}

export interface IControls {
    /**
     * How frequently the interactive app and the controls on Mixer communicate.
     */
    reportInterval: number;
    /**
     * The buttons being used.
     */
    tactiles: ITactile[];
    /**
     * The joysticks being used.
     */
    joysticks: IJoystick[];
    /**
     * The screens being used.
     */
    screens: IScreens[];
}

export interface IChannelVersion extends IVersion {
    /**
     * The controllers schema for the game version.
     */
    controls: IControls;
    /**
     * The Interactive game Id.
     */
    gameId: number;
}

export interface IGame {
    /**
     * The Id of the game.
     */
    id: number;
    /**
     * The userId of the owner.
     */
    ownerId: number;
    /**
     * The name of the game.
     */
    name: string;
    /**
     * The cover Url for the game.
     */
    coverUrl: string;
    /**
     * The description for the game.
     */
    description: string;
    /**
     * Has the game got some published versions.
     */
    hasPublishedVersions: boolean;
    /**
     * Installation guide for the game.
     */
    installation: string;
    /**
     * Time of when the game was created.
     */
    createdAt: string;
    /**
     * Time of when the game was updated.
     */
    updatedAt: string;
    /**
     * Time of when the game was deleted.
     */
    deletedAt: string;
}

export interface IControl {
    /**
     * The Id of the control.
     */
    id: number;
    /**
     * The type of the control.
     */
    type: 'joysticks' | 'tactiles' | 'screens';
    /**
     * The blueprints for the control.
     */
    blueprint: IBlueprint[];
    /**
     * Text displayed on the control.
     */
    text: string;
    /**
     * Help text on the control which is a popover.
     */
    help: string;
}

export interface ITactile extends IControl {
    /**
     * Analysis defines the kind of analysis done on the tactile.
     */
    analysis: {
        /**
         * Holding will report on how many users are currently depressing the button.
         */
        holding: boolean;
        /**
         * Frequency will report on how many users have pressed and released the button in the currently report cycle.
         */
        frequency: boolean;
    };
    /**
     * The cost/s of the button.
     */
    cost: {
        /**
         * Allows Sparks to be charge when giving input for various button actions.
         */
        press: {
            cost: number;
        };
    };
    /**
     * Cooldown defines waiting periods, in milliseconds, since a user first gave input on a button before they’re permitted to do so again.
     * This is used most often in tandem with the Cost to provide a voting mechanism.
     */
    cooldown: {
        press: number;
    };
    key: number;
}

export interface IJoystick extends IControl {
    /**
     * Analysis defines the kind of analysis done on the joystick.
     */
    analysis: {
        /**
         * Coords is currently the only archetype of analysis that can be done,
         * which will report optionally on the average and deviation of the X and Y coordinates on the joystick.
         */
        coords: {
            mean: boolean;
            stdDev: boolean;
        };
    };
}

export interface IScreens extends IControl {
    /**
     * Analysis defines the kind of analysis done on the ScreenCord.
     */
    analysis: {
        position: {
            /**
             * Will calculate the mean position of users’ mice on the screen.
             */
            mean: boolean;
            /**
             * Will calculate the standard deviation in users’ mouse positions.
             */
            stdDev: boolean;
        };
        /**
         * This control is not placed on any grid, so only active state names are required.
         */
        clicks: boolean;
    };
}

export interface IBlueprint {
    /**
     * The width of the control.
     */
    width: number;
    /**
     * The height of the control.
     */
    height: number;
    /**
     * The grid type.
     */
    grid: 'large' | 'medium' | 'small';
    /**
     * The state in which the control is displayed on.
     */
    state: string;
    /**
     * The x cord of the control.
     */
    x: number;
    /**
     * The y cord of the control.
     */
    y: number;
}
