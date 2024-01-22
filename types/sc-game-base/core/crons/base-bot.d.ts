export default class BaseBot {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {GameManagementApiClientFactory} gameManagementApiClientFactory
     */
    constructor(definition: GameDefinition, gameData: GameData, gameManagementApiClientFactory: GameManagementApiClientFactory);
    definition: GameDefinition;
    gameData: GameData;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    bots: any[];
    currentBotRatio: number;
    maxNumberOfBots: number;
    totalTickets: number;
    totalSmallTickets: number;
    totalBets: {};
    chance: any;
    botRate: number;
    totalBots: number;
    reset(): Promise<void>;
    run(): Promise<void>;
    removeAllBots(): Promise<void>;
    removeBot(botId: any): void;
    processDisabledBots(): Promise<void>;
    resetAllBotData(): void;
    resetBot(bot: any): void;
    placeBet(bot: any): Promise<void>;
    getBetChoice(bot: any): void;
    getMaxBet(bot: any, choice: any): void;
    getMinBet(): number;
    getTotalBetAmount(bet: any): number;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import GameManagementApiClientFactory from "../game-management-api";
