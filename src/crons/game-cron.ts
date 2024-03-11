import mongoose from "mongoose";
import { Table, Core } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { logger } from "sc-common";
import GameDefinition, { Duration } from "../game-definition";
import GameData from "../game-data";
import { RoundResultConsumer } from "../event-consumers";
import { getBetOdds, getCurrentTimeOfTurn, getCurrentTurn } from "../helpers";
import { ProvablyFairConsumer, UnsettledRoundConsumer } from "sc-game-base/src/core/event-consumers";
import Bot from "./bots";

type Round = {
    id: number;
    drawId: number;
    result: Array<object>;
    settlementResult: Array<object>;
};

export default class GameCron extends Table.Crons.TableGameCron {
    roundsRepository: mongoose.Model<any>;
    declare gameData: GameData;
    declare definition: GameDefinition;
    declare roundResultConsumer: RoundResultConsumer;
    declare bot: Bot;

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
        provablyFairConsumer,
        unsettledRoundConsumer,
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
        provablyFairConsumer: ProvablyFairConsumer;
        unsettledRoundConsumer: UnsettledRoundConsumer;
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
            provablyFairConsumer,
            unsettledRoundConsumer,
        });
        this.roundsRepository = roundsRepository;
    }

    async start() {
        await this.bot?.resetInRoomTrackings();
        await this.roundIdConsumer.initRoundId();
        await this.queryLastResult();
        await this.getSettingForNewRound();
        await this.updateExchangeRates();
        await this.initLastRound();
        await this.unsettledRoundConsumer.proceed();
        this.startCron();
    }

    async initLastRound() {
        const unfinishedRound = await this.getUnfinishedRound();
        this.generateRoundData(unfinishedRound);
    }

    async queryLastResult() {
        this.gameData.lastResultRecord = await this.resultsRepository.findOne({ drawId: this.gameData.drawId }).lean().exec();
    }

    async getUnfinishedRound() {
        return this.roundsRepository
            .findOne({ ended: false }, "id drawId result settlementResult", { sort: { id: -1 } })
            .lean()
            .exec();
    }

    generateRoundData(unfinishedRound?: Round) {
        this.gameData.roundResult = unfinishedRound?.result ?? [];
        this.calculateOdds(unfinishedRound?.result);
    }

    calculateOdds(roundResult: any[] = []) {
        const probabilities = this.definition.getProbabilities(roundResult);
        this.gameData.odds = getBetOdds(probabilities, this.gameData.gameConfigs?.margin);
    }

    async proceed() {
        const durations = this.definition.durations as Duration;
        const { wholeRound } = durations;

        if (this.gameData.remainingTime === wholeRound) {
            await this.checkGameStatus();
            !this.gameData.disabled && this.initRemainingTime();
        }

        const remainingTime = this.gameData.remainingTime;

        if (!this.gameData.disabled) {
            this.gameData.remainingTime--;
        }

        if (this.isChangingRoundTime(remainingTime)) {
            return;
        }

        if (this.isStartingTime(remainingTime, durations)) {
            await this.startTurn(remainingTime);
        }

        if (this.isStartingBetTime(remainingTime, durations)) {
            this.gameStatusPublisher.publishStartPlacingBetStatus();

            await this.roundResultConsumer.generateServerSeedAndPublishHash();
        }

        if (this.isDuringBetTime(remainingTime)) {
            this.bot && (await this.bot.run());
            this.runningRoundInfoPublisher.publish();
        }

        if (this.isStartingLockTime(remainingTime)) {
            this.gameStatusPublisher.publishEndPlacingBetStatus();
        }

        if (remainingTime === 0) {
            this.gameData.remainingTime = wholeRound;
        }

        if (this.isStartingGenerateResultWithPfTime(remainingTime)) {
            await this.roundResultConsumer.generateResult();

            await this.settleTurn();
        }
    }

    initRemainingTime() {
        const numberOfTurnsPerRound = this.definition.numberOfTurnsPerRound;
        const turn = this.gameData.drawId % numberOfTurnsPerRound || numberOfTurnsPerRound;
        const { wholeRound, wholeTurn, startingRound } = this.definition.durations as Duration;
        this.gameData.remainingTime = turn === 1 ? this.gameData.remainingTime : wholeRound - startingRound - wholeTurn * (turn - 1) - 1;
    }

    async startTurn(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;
        const turn = getCurrentTurn(remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);
        if (turn === 1) {
            this.resetForNewRound();
        } else {
            this.resetForNewTurn();
        }
        this.bot?.reset();
        this.appConfigs.enabledBoostedOdds && (await this.updatePromotionOddsAndNotify());
        this.publishNewTurnData();
    }

    async settleTurn() {
        if (this.gameData.result) {
            await this.settleGameRoundConsumer.settleRound();
        } else {
            this.logService.logError(`Cannot settle at draw #${this.gameData.drawId}`);
        }
    }

    resetForNewRound(): void {
        this.gameData.roundResult = [];
        this.resetForNewTurn();
        this.generateRoundData();
    }

    resetForNewTurn() {
        super.resetForNewRound();
        this.provablyFairConsumer.reset();
        this.gameData.playerBetCount = {};
        this.calculateOdds(this.gameData.roundResult);
    }

    publishNewTurnData() {
        const data = this.formatNewTurnData();
        this.runningRoundInfoPublisher.publishToAllUsers(data);
    }

    formatNewTurnData() {
        const { odds, drawId } = this.gameData;
        return { odds, drawId };
    }

    isDuringBetTime(remainingTime: number) {
        const { placingBets, wholeTurn } = this.definition.durations as Duration;
        const time = getCurrentTimeOfTurn(remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);
        return time <= placingBets && time > 0;
    }

    isStartingBetTime(remainingTime: number, durations: Duration) {
        const { placingBets, wholeTurn } = durations;
        const time = getCurrentTimeOfTurn(remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);
        return time === placingBets + 1;
    }

    isStartingTime(remainingTime: number, durations: Duration) {
        return this.isStartingBetTime(remainingTime, durations);
    }

    isStartingGenerateResultWithPfTime(remainingTime: number) {
        const { wholeTurn } = this.definition.durations as Duration;
        const time = getCurrentTimeOfTurn(remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);

        return time === 0;
    }

    isStartingLockTime(remainingTime: number) {
        const { lockingBet, wholeTurn } = this.definition.durations as Duration;
        const time = getCurrentTimeOfTurn(remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);

        return time === lockingBet;
    }

    isChangingRoundTime(remainingTime: number) {
        const numberOfTurnsPerRound = this.definition.numberOfTurnsPerRound;
        const { wholeTurn } = this.definition.durations as Duration;
        return remainingTime > wholeTurn * numberOfTurnsPerRound;
    }
}
