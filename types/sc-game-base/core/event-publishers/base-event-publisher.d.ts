export default class BaseEventPublisher {
    /**
     * @param {string} gameName
     * @param {GameData} gameData
     */
    constructor(gameName: string, gameData: GameData);
    gameName: string;
    gameData: GameData;
    publishToAllUsers(payload: any): void;
    publishToAllUsersExcept(userId: any, payload: any): void;
    publishToAllUsersExceptSystem(system: any, userId: any, payload: any): void;
    publishToUser(userId: any, payload: any, path?: string): void;
    publishToAllAdmins(payload: any): void;
    publishApiError(userId: any, apiError: any): void;
}
import GameData from "./../game-data";
