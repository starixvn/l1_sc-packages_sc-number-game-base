import mongoose from "mongoose";
import { Table, Core } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { logger } from "sc-common";
import GameDefinition, { Duration } from "../game-definition";
import GameData from "../game-data";
import { getBetOdds } from "../helpers";

type Round = {
    id: number;
    latestDrawId: number;
    result: Array<object>;
    settlementResult: Array<object>;
};

export default class GameCron extends Table.Crons.TableGameCron {
    roundsRepository: mongoose.Model<any>;
    constructor({
        definition,
        gameData,
        bot,
        settleGameRoundConsumer,
        gameStatusPublisher,
        runningRoundInfoPublisher,
        logService,
        roundResultConsumer,
        resultsRepository,
        appConfigs,
        gameManagementApiClientFactory,
        roundIdConsumer,
        roundsRepository,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        bot: Table.Crons.TableGameBot;
        settleGameRoundConsumer: Table.EventConsumers.TableSettleGameRoundConsumer;
        gameStatusPublisher: Core.BaseEventPublishers.GameStatusPublisher;
        runningRoundInfoPublisher: Core.BaseEventPublishers.RunningRoundInfoPublisher;
        logService: typeof logger;
        roundResultConsumer: Core.BaseEventConsumers.RoundResultConsumer;
        resultsRepository: mongoose.Model<any>;
        appConfigs: any;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        roundIdConsumer: Core.BaseEventConsumers.RoundIdConsumer;
        roundsRepository: mongoose.Model<any>;
    }) {
        super({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher,
            logService,
            roundResultConsumer,
            resultsRepository,
            appConfigs,
            gameManagementApiClientFactory,
            roundIdConsumer,
        });
        this.roundsRepository = roundsRepository;
    }

    async start() {
        await this.roundIdConsumer.initRoundId();
        await this.queryLastResult();
        await this.initResultHash();
        await this.getSettingForNewRound();
        await this.updateExchangeRates();
        await this.initLatestRound();
        this.initRemainingTime();
        this.startCron();
    }

    async initLatestRound() {
        const unfinishedRound = await this.getUnfinishedRound();
        this.generateRoundData(unfinishedRound);
    }

    initRemainingTime() {
        const numberOfTurnsPerRound = (this.definition as GameDefinition).numberOfTurnsPerRound;
        const turn = (this.gameData as GameData).drawId % numberOfTurnsPerRound || numberOfTurnsPerRound;
        const { wholeRound, wholeTurn } = this.definition.durations as Duration;
        this.gameData.remainingTime = wholeRound - wholeTurn * (turn - 1);
    }

    async getUnfinishedRound() {
        return this.roundsRepository
            .findOne({ ended: false }, "id latestDrawId result settlementResult", { sort: { id: -1 } })
            .lean()
            .exec();
    }

    generateRoundData(unfinishedRound?: Round) {
        const probabilities = (this.definition as GameDefinition).getProbabilities(unfinishedRound?.result);
        (this.gameData as GameData).odds = getBetOdds(probabilities, this.gameData.gameConfigs.odds);
    }

    async proceed() {
        const durations = this.definition.durations as Duration;
        const { wholeRound } = durations;

        if (this.gameData.remainingTime === wholeRound) {
            await this.checkGameStatus();
        }

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }

        const remainingTime = this.gameData.remainingTime;
        if (this.isStartingTime(remainingTime, durations)) {
            await this.startTurn(remainingTime);
        }

        if (this.isStartingGenerateResultTime(remainingTime) && this.resultsRepository) {
            await this.roundResultConsumer.generateResultAndPublishHash(this.gameData.lastResultRecord);
            this.gameData.settlementResultFromAdmin = {};
        }

        if (this.isStartingBetTime(remainingTime, durations)) {
            this.gameStatusPublisher.publishStartPlacingBetStatus();
        }

        if (this.isStartingLockTime(remainingTime)) {
            this.gameStatusPublisher.publishEndPlacingBetStatus();
        }

        if (this.isSettlingTime(remainingTime)) {
            if (remainingTime < 0) {
                this.gameData.remainingTime = wholeRound;
            }
            await this.settleGameRoundConsumer.settleRound();
        }

        if (this.isDuringBetTime(remainingTime)) {
            this.bot && (await this.bot.run());
            this.runningRoundInfoPublisher.publish();
        }
    }

    async startTurn(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;
        const turn = Math.ceil(remainingTime / wholeTurn);
        if (turn === (this.definition as GameDefinition).numberOfTurnsPerRound) {
            this.resetForNewRound();
        } else {
            this.resetForNewTurn();
        }
        this.bot?.reset();
        this.appConfigs.enabledBoostedOdds && (await this.updatePromotionOddsAndNotify());
        this.publishNewTurnData();
    }

    resetForNewRound(): void {
        this.resetForNewTurn();
        this.generateRoundData();
    }

    resetForNewTurn() {
        super.resetForNewRound();
    }

    publishNewTurnData() {
        const data = this.formatNewTurnData();
        this.runningRoundInfoPublisher.publishToAllUsers(data);
    }

    formatNewTurnData() {
        return { odds: (this.gameData as GameData).odds };
    }

    isDuringBetTime(remainingTime: number) {
        const { placingBets, wholeTurn } = this.definition.durations as Duration;
        const turn = Math.ceil(remainingTime / wholeTurn) || 1;
        const time = remainingTime - wholeTurn * (turn - 1);
        return time < placingBets && time >= 0;
    }

    isStartingBetTime(remainingTime: number, durations: Duration) {
        const { placingBets, wholeTurn } = durations;
        const turn = Math.ceil(remainingTime / wholeTurn);
        const time = remainingTime - wholeTurn * (turn - 1);
        return time === placingBets;
    }

    isStartingTime(remainingTime: number, durations: Duration) {
        return this.isStartingBetTime(remainingTime, durations);
    }

    isStartingGenerateResultTime(remainingTime: number) {
        const { wholeRound, placingBets, wholeTurn } = this.definition.durations as Duration;
        return remainingTime === wholeRound - wholeTurn + placingBets;
    }

    isSettlingTime(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;
        const turn = Math.ceil(remainingTime / wholeTurn) || 1;
        return remainingTime < 0 || remainingTime - wholeTurn * turn === 0;
    }

    isStartingLockTime(remainingTime: number) {
        const { wholeTurn, lockingBet } = this.definition.durations as Duration;
        const turn = Math.ceil(remainingTime / wholeTurn);
        const time = remainingTime - wholeTurn * (turn - 1);
        return time === lockingBet - 1;
    }
}
