export default class ProcessBetQueue {
    /**
     * @param {Object} dependencies
     * @param {GameDefinition} dependencies.definition
     * @param {GameData} dependencies.gameData
     * @param {PlaceBetPublisher} dependencies.placeBetPublisher
     * @param {*} dependencies.placeBet
     * @param {logger} dependencies.logService
     * @param {mongoose.Model} dependencies.betsRepository
     * @param {mongoose.Model} dependencies.betLogsRepository
     * @param {GameManagementApiClientFactory} dependencies.gameManagementApiClientFactory
     * @param {BaseMetrics} dependencies.baseMetrics
     */
    constructor({ definition, gameData, placeBetPublisher, placeBet, logService, betsRepository, betLogsRepository, gameManagementApiClientFactory, baseMetrics, }: {
        definition: GameDefinition;
        gameData: GameData;
        placeBetPublisher: PlaceBetPublisher;
        placeBet: any;
        logService: logger;
        betsRepository: mongoose.Model;
        betLogsRepository: mongoose.Model;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        baseMetrics: BaseMetrics;
    });
    processTimeOut: number;
    definition: GameDefinition;
    gameData: GameData;
    placeBetPublisher: PlaceBetPublisher;
    placeBet: any;
    logService: logger;
    betsRepository: mongoose.Model;
    betLogsRepository: mongoose.Model;
    baseMetrics: BaseMetrics;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    start(): void;
    dequeueBets(): void;
    proceedBet(player: any, payload: any): Promise<void>;
    validateBetRequest(player: any, payload: any): Promise<boolean>;
    composeValidationCriteria(player: any, payload: any): Promise<{
        failure: boolean;
        notice: {
            errorCode: any;
        };
    }[]>;
    composeBettingTimeValidationCriteria(roundId: any): {
        failure: boolean;
        notice: {
            errorCode: any;
        };
    }[];
    composeBalanceValidationCriteria(player: any, payload: any): Promise<{
        failure: boolean;
        notice: {
            errorCode: any;
        };
    }[]>;
    getCoinBalance(player: any): Promise<any>;
    updateUserStakeLevel(player: any, minBet: any, maxBet: any): void;
    formatApiBetInfo(payload: any): {
        amount: any;
        gameId: number;
        gameRoundId: any;
        choiceId: any;
        freeBet: any;
        clientSentTime: any;
        metadata: {
            mode: string;
        };
    };
    handleSuccessBet(player: any, balance: any, roundId: any, bet: any): Promise<void>;
    handleFailedBet(player: any, notice: any, bet: any): void;
    upsertBet(player: any, roundId: any, bet: any, rate: any): Promise<void>;
    insertBetLog(player: any, roundId: any, bet: any, rate: any): Promise<void>;
    decreaseBetTracks(playerName: any, bet: any): void;
    adjustOwnBets(playerName: any, bet: any): void;
    adjustTotalBets(player: any, bet: any, rate: any): void;
    notifyPlacingBetResult(player: any, balance: any, bet: any, rate: any): void;
    generatePlacingBetResult(player: any, balance: any, bet: any, rate: any): {
        ownBets: any;
        endBet: any;
        betChoice: any;
        freeBet: any;
        user: any;
    };
    calculateCurrencyRate(session: any): number;
    isCountOnTotalBets(player: any): boolean;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { PlaceBetPublisher } from "./../event-publishers";
import BaseMetrics from "../base-metrics";
import GameManagementApiClientFactory from "../game-management-api";
