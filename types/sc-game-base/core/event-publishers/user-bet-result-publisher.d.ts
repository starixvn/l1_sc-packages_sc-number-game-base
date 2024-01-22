export default class UserBetResultPublisher extends BaseEventPublisher {
    /**
     * @param {string} gameName
     * @param {GameData} gameData
     * @param {logger} logService
     */
    constructor(gameName: string, gameData: GameData, logService: logger);
    logService: logger;
    publish(userId: any, betResult: any): Promise<void>;
    publishToUser(userId: any, payload: any, path?: string): Promise<void>;
}
import BaseEventPublisher from "./base-event-publisher";
import GameData from "./../game-data";
