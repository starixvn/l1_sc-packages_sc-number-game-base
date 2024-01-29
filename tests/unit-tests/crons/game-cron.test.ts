import { stub } from "jest-auto-stub";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import { Core, Table } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { GameCron } from "../../../src/crons";
import { getBetOdds } from "../../../src/helpers";

jest.mock("../../../src/helpers", () => ({ getBetOdds: jest.fn() }));
describe("GameCron tests", () => {
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const bot = stub<Table.Crons.TableGameBot>();
    const settleConsumer = stub<Table.EventConsumers.TableSettleGameRoundConsumer>();
    const gameStatusPublisher = stub<Core.BaseEventPublishers.GameStatusPublisher>();
    const runningRoundPublisher = stub<Core.BaseEventPublishers.RunningRoundInfoPublisher>();
    const roundResultConsumer = stub<Core.BaseEventConsumers.RoundResultConsumer>();
    const gameManagementApiClientFactory = stub<GameManagementApiClientFactory>();
    const roundIdConsumer = stub<Core.BaseEventConsumers.RoundIdConsumer>();

    let consumer: GameCron;
    beforeEach(() => {
        consumer = new GameCron({
            definition,
            gameData,
            bot,
            settleGameRoundConsumer: settleConsumer,
            gameStatusPublisher,
            runningRoundInfoPublisher: runningRoundPublisher,
            logService: null as any,
            roundResultConsumer,
            resultsRepository: {} as any,
            appConfigs: {},
            gameManagementApiClientFactory,
            roundIdConsumer,
            roundsRepository: { findOne: jest.fn() } as any,
        });
        consumer.startCron = jest.fn();
        roundIdConsumer.initRoundId = jest.fn();
    });

    describe("start", () => {
        beforeEach(() => {
            consumer.queryLastResult = jest.fn();
            consumer.initResultHash = jest.fn();
            consumer.getSettingForNewRound = jest.fn();
            consumer.updateExchangeRates = jest.fn();
        });
        it("should run correctly", async () => {
            // arrange
            consumer.initLastRound = jest.fn();
            consumer.initRemainingTime = jest.fn();
            // act
            await consumer.start();

            // assert
            expect(consumer.queryLastResult).toHaveBeenCalled();
            expect(consumer.initResultHash).toHaveBeenCalled();
            expect(consumer.getSettingForNewRound).toHaveBeenCalled();
            expect(consumer.updateExchangeRates).toHaveBeenCalled();
            expect(consumer.initLastRound).toHaveBeenCalled();
            expect(consumer.initRemainingTime).toHaveBeenCalled();
            expect(consumer.startCron).toHaveBeenCalled();
        });

        it("should init last round data when there is unfinished round", async () => {
            // arrange
            consumer.initRemainingTime = jest.fn();
            const unfinishedRound = { id: 1, drawId: 2, result: [], settlementResult: [] };
            (consumer.roundsRepository.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockReturnValue(unfinishedRound),
                }),
            });
            (consumer.definition as GameDefinition).getProbabilities = jest.fn().mockReturnValue({});
            (getBetOdds as jest.Mock).mockReturnValue({ choice1: 2 });
            consumer.gameData.gameConfigs.odds = { choice1: 0.1 };

            // act
            await consumer.start();

            // assert
            expect((consumer.definition as GameDefinition).getProbabilities).toHaveBeenCalledWith(unfinishedRound.result);
            expect(getBetOdds).toHaveBeenCalledWith({}, { choice1: 0.1 });
            expect((consumer.gameData as GameData).odds).toEqual({ choice1: 2 });
        });

        describe("initRemainingTime", () => {
            beforeEach(() => {
                consumer.initLastRound = jest.fn();
                (consumer.definition as GameDefinition).numberOfTurnsPerRound = 4;
                consumer.definition.durations = { wholeRound: 132, wholeTurn: 33 } as any;
            });
            const testCases = [
                { drawId: 5, expectedRemainingTime: 132 },
                { drawId: 6, expectedRemainingTime: 99 },
                { drawId: 7, expectedRemainingTime: 66 },
                { drawId: 8, expectedRemainingTime: 33 },
            ];
            it.each(testCases)("should set correctly remaining time", async ({ drawId, expectedRemainingTime }) => {
                // arrange
                (consumer.gameData as GameData).drawId = drawId;

                // act
                await consumer.start();

                // assert
                expect(gameData.remainingTime).toBe(expectedRemainingTime);
            });
        });
    });

    describe("proceed", () => {
        const durations = {
            wholeRound: 132,
            placingBets: 25,
            lockingBet: 3,
            showingResult: 5,
            wholeTurn: 33,
        };
        beforeEach(() => {
            consumer.definition.durations = durations as any;
            (consumer.definition as GameDefinition).numberOfTurnsPerRound = 4;
            consumer.gameData.disabled = false;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });
        it("should call checkGameStatus when remainingTime === wholeRound", async () => {
            // arrange
            consumer.checkGameStatus = jest.fn();
            consumer.gameData.remainingTime = durations.wholeRound;

            // act
            await consumer.proceed();

            // assert
            expect(consumer.checkGameStatus).toHaveBeenCalled();
        });

        describe("when starting bet time", () => {
            beforeEach(() => {
                consumer.appConfigs.enabledBoostedOdds = false;
                consumer.bot.reset = jest.fn();
                consumer.runningRoundInfoPublisher.publishToAllUsers = jest.fn();
                consumer.roundResultConsumer.generateResultAndPublishHash = jest.fn();
                consumer.gameStatusPublisher.publishStartPlacingBetStatus = jest.fn();
                Table.Crons.TableGameCron.prototype.resetForNewRound = jest.fn();
                (getBetOdds as jest.Mock).mockReturnValue({ choice1: 1 });
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            const testCases = [{ remainingTime: 26 }, { remainingTime: 59 }, { remainingTime: 92 }];
            it.each(testCases)("should call reset for new turn", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(Table.Crons.TableGameCron.prototype.resetForNewRound).toHaveBeenCalled();
            });

            it.each(testCases)("should call bot reset", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.bot.reset).toHaveBeenCalled();
            });

            it.each(testCases)("should publish new turn data", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                (consumer.gameData as GameData).odds = { choice1: 10 };

                // act
                await consumer.proceed();

                // assert
                expect(consumer.runningRoundInfoPublisher.publishToAllUsers).toHaveBeenCalledWith({ odds: { choice1: 10 } });
            });

            const remainingTimeStartingNewRound = 125;
            it("should reset for new round when starting a new round", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect(Table.Crons.TableGameCron.prototype.resetForNewRound).toHaveBeenCalled();
            });

            it("should reset odds for new round when starting a new round", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect((consumer.gameData as GameData).odds).toEqual({ choice1: 1 });
            });

            it.each(testCases)("should call bot reset", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.bot.reset).toHaveBeenCalled();
            });

            it.each(testCases)("should publish new turn data", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.runningRoundInfoPublisher.publishToAllUsers).toHaveBeenCalledWith({ odds: { choice1: 1 } });
            });
        });

        describe("when starting generate result time", () => {
            beforeEach(() => {
                consumer.appConfigs.enabledBoostedOdds = false;
                consumer.bot.reset = jest.fn();
                consumer.startTurn = jest.fn();
                consumer.roundResultConsumer.generateResultAndPublishHash = jest.fn();
                consumer.gameStatusPublisher.publishStartPlacingBetStatus = jest.fn();
            });
            it("should call roundResultConsumer.generateResultAndPublishHash", async () => {
                // arrange
                consumer.gameData.remainingTime = 125;
                consumer.gameData.lastResultRecord = null;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.roundResultConsumer.generateResultAndPublishHash).toHaveBeenCalledWith(null);
            });
            it("should set settlementResultFromAdmin = {}", async () => {
                // arrange
                consumer.gameData.remainingTime = 125;
                consumer.gameData.lastResultRecord = null;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.gameData.settlementResultFromAdmin).toEqual({});
            });
        });

        describe("isStartingLockTime", () => {
            beforeEach(() => {
                consumer.appConfigs.enabledBoostedOdds = false;
                consumer.bot.reset = jest.fn();
                consumer.startTurn = jest.fn();
                consumer.runningRoundInfoPublisher.publish();
                consumer.gameStatusPublisher.publishEndPlacingBetStatus = jest.fn();
                consumer.bot = null as any;
            });
            const testCases = [{ remainingTime: 3 }, { remainingTime: 36 }, { remainingTime: 69 }, { remainingTime: 102 }];
            it.each(testCases)("should call gameStatusPublisher.publishEndPlacingBetStatus", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.gameStatusPublisher.publishEndPlacingBetStatus).toHaveBeenCalled();
            });
        });

        describe("isDuringBetTime", () => {
            beforeEach(() => {
                consumer.startTurn = jest.fn();
                consumer.roundResultConsumer.generateResultAndPublishHash = jest.fn();
                consumer.gameStatusPublisher.publishStartPlacingBetStatus = jest.fn();
                consumer.gameStatusPublisher.publishEndPlacingBetStatus = jest.fn();
                consumer.runningRoundInfoPublisher.publish = jest.fn();
                consumer.bot.run = jest.fn();
            });
            afterEach(() => {
                jest.clearAllMocks();
            });
            const testCases = [
                { remainingTime: 1 },
                { remainingTime: 2 },
                { remainingTime: 3 },
                { remainingTime: 4 },
                { remainingTime: 5 },
                { remainingTime: 6 },
                { remainingTime: 7 },
                { remainingTime: 8 },
                { remainingTime: 25 },
                { remainingTime: 34 },
                { remainingTime: 35 },
                { remainingTime: 36 },
                { remainingTime: 37 },
                { remainingTime: 38 },
                { remainingTime: 57 },
                { remainingTime: 58 },
                { remainingTime: 68 },
                { remainingTime: 69 },
                { remainingTime: 70 },
                { remainingTime: 71 },
                { remainingTime: 72 },
                { remainingTime: 91 },
                { remainingTime: 101 },
                { remainingTime: 102 },
                { remainingTime: 103 },
                { remainingTime: 122 },
                { remainingTime: 123 },
                { remainingTime: 124 },
            ];
            it.each(testCases)("should run bot", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.bot.run).toHaveBeenCalled();
            });

            it.each(testCases)("should publish round info", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.runningRoundInfoPublisher.publish).toHaveBeenCalled();
            });
        });

        describe("isSettlingTime", () => {
            const testCases = [{ remainingTime: 99 }, { remainingTime: 66 }, { remainingTime: 33 }];
            it.each(testCases)("should call settleGameRoundConsumer.settleRound", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.settleGameRoundConsumer.settleRound).toHaveBeenCalled();
            });

            it("should call settleGameRoundConsumer.settleRound when remainingTime < 0", async () => {
                // arrange
                consumer.gameData.remainingTime = 0;
                // act
                await consumer.proceed();

                // assert
                expect(consumer.settleGameRoundConsumer.settleRound).toHaveBeenCalled();
            });

            it("should reset time when remainingTime < 0", async () => {
                // arrange
                consumer.gameData.remainingTime = 0;
                // act
                await consumer.proceed();

                // assert
                expect(consumer.gameData.remainingTime).toBe(durations.wholeRound);
            });
        });
    });
});
