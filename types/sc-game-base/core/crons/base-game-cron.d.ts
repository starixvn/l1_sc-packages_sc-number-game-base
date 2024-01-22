export default class BaseGameCron {
    /**
     *
     * @param {Object} dependencies
     * @param {GameDefinition} dependencies.definition
     * @param {GameData} dependencies.gameData
     * @param {BaseBot} dependencies.bot
     * @param {SettleGameRoundConsumer} dependencies.settleGameRoundConsumer
     * @param {GameStatusPublisher} dependencies.gameStatusPublisher
     * @param {RunningRoundInfoPublisher} dependencies.runningRoundInfoPublisher
     * @param {logger} dependencies.logService
     * @param {RoundResultConsumer} dependencies.roundResultConsumer
     * @param {mongoose.Model} dependencies.resultsRepository
     * @param {GameManagementApiClientFactory} dependencies.gameManagementApiClientFactory
     * @param {RoundIdConsumer} dependencies.roundIdConsumer
     */
    constructor({ definition, gameData, bot, settleGameRoundConsumer, gameStatusPublisher, runningRoundInfoPublisher, logService, roundResultConsumer, resultsRepository, appConfigs, gameManagementApiClientFactory, roundIdConsumer, }: {
        definition: GameDefinition;
        gameData: GameData;
        bot: BaseBot;
        settleGameRoundConsumer: SettleGameRoundConsumer;
        gameStatusPublisher: GameStatusPublisher;
        runningRoundInfoPublisher: RunningRoundInfoPublisher;
        logService: logger;
        roundResultConsumer: RoundResultConsumer;
        resultsRepository: mongoose.Model;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        roundIdConsumer: RoundIdConsumer;
    });
    definition: GameDefinition;
    gameData: GameData;
    bot: BaseBot;
    settleGameRoundConsumer: SettleGameRoundConsumer;
    gameStatusPublisher: GameStatusPublisher;
    runningRoundInfoPublisher: RunningRoundInfoPublisher;
    logService: logger;
    roundResultConsumer: RoundResultConsumer;
    resultsRepository: mongoose.Model;
    appConfigs: any;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    roundIdConsumer: RoundIdConsumer;
    start(): Promise<void>;
    queryLastResult(): Promise<void>;
    initResultHash(): Promise<void>;
    startCron(): void;
    proceed(): Promise<void>;
    isStartingTime(remainingTime: any, durations: any): boolean;
    checkGameStatus(): Promise<void>;
    assignNewGameConfigs(newGameConfigs: any): void;
    handleGameStatus(previouslyDisabled: any): Promise<void>;
    updatePromotionOdds(): Promise<any>;
    updatePromotionOddsAndNotify(): Promise<void>;
    resetForNewRound(): void;
    getSettingForNewRound(): Promise<void>;
    updateExchangeRates(): Promise<void>;
    updateCurrencyGroupGames(): Promise<void>;
    updatePartnerGameSiteExclusions(): Promise<void>;
    updateCurrencyGroups(): Promise<void>;
    updateCurrencies(): Promise<void>;
    enableGame(): Promise<void>;
    getDelayStartTime(configuredlyDisabled: any, newGameConfigs: any): any;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import BaseBot from "./base-bot";
import { SettleGameRoundConsumer } from "./../event-consumers";
import { GameStatusPublisher } from "./../event-publishers";
import { RunningRoundInfoPublisher } from "./../event-publishers";
import { RoundResultConsumer } from "./../event-consumers";
import { RoundIdConsumer } from "./../event-consumers";
import GameManagementApiClientFactory from "../game-management-api";
