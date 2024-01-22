export default class PlayGamePermissionValidator {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     */
    constructor(definition: GameDefinition, gameData: GameData, userSignInPublisher: any);
    definition: GameDefinition;
    gameData: GameData;
    userSignInPublisher: any;
    validate(userSession: any, socketClient: any): boolean;
    isHavePlayingPermission(userSession: any): boolean;
    isValidCurrency(userSession: any): boolean;
    isValidGroupCurrency(userSession: any): boolean;
    isOffered(userSession: any): boolean;
    isSiteExcluded(userSession: any): any;
}
import GameDefinition from "../game-definition";
import GameData from "../game-data";
