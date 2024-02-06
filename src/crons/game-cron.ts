import mongoose from "mongoose";
import { Table, Core } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { logger } from "sc-common";
import GameDefinition, { Duration } from "../game-definition";
import GameData from "../game-data";
import { getBetOdds } from "../helpers";

type Round = {
    id: number;
    drawId: number;
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
        await this.initLastRound();
        this.startCron();
    }

    async initLastRound() {
        const unfinishedRound = await this.getUnfinishedRound();
        this.generateRoundData(unfinishedRound);
    }

    async getUnfinishedRound() {
        return this.roundsRepository
            .findOne({ ended: false }, "id drawId result settlementResult", { sort: { id: -1 } })
            .lean()
            .exec();
    }

    generateRoundData(unfinishedRound?: Round) {
        (this.gameData as GameData).roundResult = unfinishedRound?.result ?? [];
        this.calculateOdds(unfinishedRound?.result);
    }

    calculateOdds(roundResult: any[] = []) {
        const probabilities = (this.definition as GameDefinition).getProbabilities(roundResult);
        (this.gameData as GameData).odds = getBetOdds(probabilities, this.gameData.gameConfigs?.margin);
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

    async checkGameStatus() {
        await super.checkGameStatus();
        !this.gameData.disabled && this.initRemainingTime();
    }

    initRemainingTime() {
        const numberOfTurnsPerRound = (this.definition as GameDefinition).numberOfTurnsPerRound;
        const turn = (this.gameData as GameData).drawId % numberOfTurnsPerRound || numberOfTurnsPerRound;
        const { wholeRound, wholeTurn, startingRound } = this.definition.durations as Duration;
        this.gameData.remainingTime = turn === 1 ? wholeRound : wholeRound - startingRound - wholeTurn * (turn - 1);
    }

    async startTurn(remainingTime: number) {
        const turn = this.getCurrentTurn(remainingTime);
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
        (this.gameData as GameData).roundResult = [];
        this.resetForNewTurn();
        this.generateRoundData();
    }

    resetForNewTurn() {
        super.resetForNewRound();
        this.calculateOdds((this.gameData as GameData).roundResult);
    }

    publishNewTurnData() {
        const data = this.formatNewTurnData();
        this.runningRoundInfoPublisher.publishToAllUsers(data);
    }

    formatNewTurnData() {
        const { odds, drawId } = this.gameData as GameData;
        return { odds, drawId };
    }

    isDuringBetTime(remainingTime: number) {
        const { placingBets, wholeTurn } = this.definition.durations as Duration;
        const time = this.getCurrentTimeOfTurn(remainingTime);
        return (time < placingBets || time === wholeTurn) && time >= 0;
    }

    isStartingBetTime(remainingTime: number, durations: Duration) {
        const { placingBets } = durations;
        const time = this.getCurrentTimeOfTurn(remainingTime);
        return time === placingBets;
    }

    isStartingTime(remainingTime: number, durations: Duration) {
        return this.isStartingBetTime(remainingTime, durations);
    }

    isStartingGenerateResultTime(remainingTime: number) {
        const { wholeRound, placingBets, wholeTurn, startingRound } = this.definition.durations as Duration;
        return remainingTime === wholeRound - startingRound - wholeTurn + placingBets;
    }

    isSettlingTime(remainingTime: number) {
        const { wholeTurn, wholeRound, startingRound } = this.definition.durations as Duration;
        const turn = this.getCurrentTurn(remainingTime);
        return (remainingTime < 0 || remainingTime - wholeTurn * turn === -1) && remainingTime !== wholeRound - startingRound - 1;
    }

    isStartingLockTime(remainingTime: number) {
        const { lockingBet } = this.definition.durations as Duration;
        const time = this.getCurrentTimeOfTurn(remainingTime);
        return time === lockingBet - 1;
    }

    getCurrentTimeOfTurn(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;

        const turn = Math.ceil(remainingTime / wholeTurn);
        return remainingTime - wholeTurn * (turn - 1);
    }

    getCurrentTurn(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;

        return Math.ceil(remainingTime / wholeTurn);
    }
}
