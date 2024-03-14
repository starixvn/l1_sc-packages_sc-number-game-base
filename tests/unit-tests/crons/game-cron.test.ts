import { stub } from "jest-auto-stub";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import { Core, Table } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { GameCron } from "../../../src/crons";
import { getBetOdds } from "../../../src/helpers";
import { ProvablyFairConsumer, UnsettledRoundConsumer } from "sc-game-base/src/core/event-consumers";

jest.mock("../../../src/helpers/calculate-odds", () => ({ getBetOdds: jest.fn() }));
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
    const provablyFairConsumer = stub<ProvablyFairConsumer>();
    const unsettledRoundConsumer = stub<UnsettledRoundConsumer>();

    const durations = {
        wholeRound: 142,
        placingBets: 25,
        lockingBet: 3,
        showingResult: 5,
        wholeTurn: 35,
        startingRound: 2,
    };
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
            provablyFairConsumer,
            unsettledRoundConsumer,
        });
        consumer.startCron = jest.fn();
        roundIdConsumer.initRoundId = jest.fn();
    });

    describe("start", () => {
        beforeEach(() => {
            consumer.queryLastResult = jest.fn();
            consumer.getSettingForNewRound = jest.fn();
            consumer.updateExchangeRates = jest.fn();
            consumer.bot.resetInRoomTrackings = jest.fn();
        });
        it("should run correctly", async () => {
            // arrange
            consumer.initLastRound = jest.fn();
            consumer.gameData.disabled = false;

            // act
            await consumer.start();

            // assert
            expect(consumer.bot.resetInRoomTrackings).toHaveBeenCalled();
            expect(consumer.queryLastResult).toHaveBeenCalled();
            expect(consumer.getSettingForNewRound).toHaveBeenCalled();
            expect(consumer.updateExchangeRates).toHaveBeenCalled();
            expect(consumer.initLastRound).toHaveBeenCalled();
            expect(consumer.startCron).toHaveBeenCalled();
        });

        it("should init last round data when there is unfinished round", async () => {
            // arrange
            const unfinishedRound = { id: 1, drawId: 2, result: [], settlementResult: [] };
            (consumer.roundsRepository.findOne as jest.Mock).mockReturnValue({
                lean: jest.fn().mockReturnValue({
                    exec: jest.fn().mockReturnValue(unfinishedRound),
                }),
            });
            consumer.definition.getProbabilities = jest.fn().mockReturnValue({});
            (getBetOdds as jest.Mock).mockReturnValue({ choice1: 2 });
            consumer.gameData.gameConfigs.margin = [{ max: 100, choice1: 0.1 }];

            // act
            await consumer.start();

            // assert
            expect(consumer.definition.getProbabilities).toHaveBeenCalledWith(unfinishedRound.result);
            expect(getBetOdds).toHaveBeenCalledWith({}, consumer.gameData.gameConfigs.margin);
            expect(consumer.gameData.odds).toEqual({ choice1: 2 });
        });
    });

    describe("proceed", () => {
        beforeEach(() => {
            consumer.definition.durations = durations as any;
            consumer.definition.numberOfTurnsPerRound = 4;
            consumer.gameData.disabled = false;
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        describe("When at certain remaining time", () => {
            const testCases = [...Array(142 + 1).keys()].map((t) => ({ remainingTime: t }));
            const changingRoundTime = [141, 142];
            const startingBetTime = [26, 61, 96, 131];
            const startingLockTime = [3, 38, 73, 108];
            const duringBetTime = [
                1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 36, 37, 38, 39, 40, 41, 42, 43,
                44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84,
                85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
                122, 123, 124, 125, 126, 127, 128, 129, 130,
            ];

            it.each(testCases)("should return correct", async ({ remainingTime }) => {
                // arrange
                consumer.initRemainingTime = jest.fn();
                consumer.gameData.disabled = false;
                consumer.checkGameStatus = jest.fn();
                consumer.gameData.remainingTime = remainingTime;

                // act
                const isChangingRoundTime = consumer.isChangingRoundTime(remainingTime);
                const isStartingBetTime = consumer.isStartingBetTime(remainingTime, durations);
                const isDuringBetTime = consumer.isDuringBetTime(remainingTime);
                const isStartingLockTime = consumer.isStartingLockTime(remainingTime);
                const isStartingGenerateResultWithPfTime = consumer.isStartingGenerateResultWithPfTime(remainingTime);

                // assert
                if (changingRoundTime.includes(remainingTime)) {
                    expect(isStartingBetTime).toBe(false);
                    expect(isChangingRoundTime).toBe(true);
                    expect(isDuringBetTime).toBe(false);
                    expect(isStartingLockTime).toBe(false);
                    expect(isStartingGenerateResultWithPfTime).toBe(false);
                }

                if (startingBetTime.includes(remainingTime)) {
                    expect(isStartingBetTime).toBe(true);
                    expect(isChangingRoundTime).toBe(false);
                    expect(isDuringBetTime).toBe(false);
                    expect(isStartingLockTime).toBe(false);
                    expect(isStartingGenerateResultWithPfTime).toBe(false);
                }

                if (duringBetTime.includes(remainingTime) && !startingLockTime.includes(remainingTime)) {
                    expect(isStartingBetTime).toBe(false);
                    expect(isChangingRoundTime).toBe(false);
                    expect(isDuringBetTime).toBe(true);
                    expect(isStartingLockTime).toBe(false);
                    expect(isStartingGenerateResultWithPfTime).toBe(false);
                }

                if (startingLockTime.includes(remainingTime)) {
                    expect(isStartingBetTime).toBe(false);
                    expect(isChangingRoundTime).toBe(false);
                    expect(isDuringBetTime).toBe(true);
                    expect(isStartingLockTime).toBe(true);
                    expect(isStartingGenerateResultWithPfTime).toBe(false);
                }
            });
        });

        describe("when remaining === wholeRound", () => {
            it("should call checkGameStatus when remainingTime === wholeRound", async () => {
                // arrange
                consumer.checkGameStatus = jest.fn();
                consumer.gameData.remainingTime = durations.wholeRound;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.checkGameStatus).toHaveBeenCalled();
            });

            describe("initRemainingTime", () => {
                beforeEach(() => {
                    consumer.initLastRound = jest.fn();
                    consumer.definition.numberOfTurnsPerRound = 4;
                    consumer.definition.durations = durations as any;
                    consumer.gameData.remainingTime = durations.wholeRound;
                    consumer.gameData.disabled = false;
                    consumer.checkGameStatus = jest.fn();
                });
                const testCases = [
                    { drawId: 5, expectedRemainingTime: 141 },
                    { drawId: 6, expectedRemainingTime: 103 },
                    { drawId: 7, expectedRemainingTime: 68 },
                    { drawId: 8, expectedRemainingTime: 33 },
                ];
                it.each(testCases)("should set correctly remaining time", async ({ drawId, expectedRemainingTime }) => {
                    // arrange
                    consumer.gameData.drawId = drawId;

                    // act
                    await consumer.proceed();

                    // assert
                    expect(gameData.remainingTime).toBe(expectedRemainingTime);
                });
            });
        });

        describe("when remaining !== wholeRound", () => {
            it("should NOT call checkGameStatus when remainingTime === wholeRound", async () => {
                // arrange
                consumer.checkGameStatus = jest.fn();
                consumer.gameData.remainingTime = durations.wholeRound - 1;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.checkGameStatus).not.toHaveBeenCalled();
            });
        });

        describe("when changing round time", () => {
            it.each([142, 141])("should not do anything", async (remainingTime) => {
                // arrange
                consumer.isStartingTime = jest.fn();
                consumer.checkGameStatus = jest.fn();
                consumer.initRemainingTime = jest.fn();
                consumer.gameData.disabled = false;
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.isStartingTime).not.toHaveBeenCalled();
            });
        });

        describe("when starting bet time", () => {
            beforeEach(() => {
                consumer.appConfigs.enabledBoostedOdds = false;
                consumer.bot.reset = jest.fn();
                consumer.runningRoundInfoPublisher.publishToAllUsers = jest.fn();
                consumer.gameStatusPublisher.publishStartPlacingBetStatus = jest.fn();
                consumer.definition.getProbabilities = jest.fn();
                Table.Crons.TableGameCron.prototype.resetForNewRound = jest.fn();
                (getBetOdds as jest.Mock).mockReturnValue({ choice1: 1 });
                consumer.roundResultConsumer.generateServerSeedAndPublishHash = jest.fn();
            });

            afterEach(() => {
                jest.clearAllMocks();
            });

            const testCases = [{ remainingTime: 26 }, { remainingTime: 61 }, { remainingTime: 96 }];
            it.each(testCases)("should call reset for new turn", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(Table.Crons.TableGameCron.prototype.resetForNewRound).toHaveBeenCalled();
            });

            it.each(testCases)("should reset playerBetCount", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                consumer.gameData.playerBetCount = { choice1: ["123"] };

                // act
                await consumer.proceed();

                // assert
                expect(gameData.playerBetCount).toEqual({});
            });

            it.each(testCases)("should call bot reset", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.bot.reset).toHaveBeenCalled();
            });

            it.each(testCases)("should calculate odds", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                consumer.gameData.gameConfigs.margin = [];
                (getBetOdds as jest.Mock).mockReturnValueOnce({ choice1: 10 });
                (consumer.definition.getProbabilities as jest.Mock).mockReturnValueOnce({ choice1: 0.1 });

                // act
                await consumer.proceed();

                // assert
                expect(getBetOdds).toHaveBeenCalledWith({ choice1: 0.1 }, []);
            });

            it.each(testCases)("should publish new turn data", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                consumer.gameData.drawId = 2;
                (getBetOdds as jest.Mock).mockReturnValueOnce({ choice1: 10 });

                // act
                await consumer.proceed();

                // assert
                expect(consumer.runningRoundInfoPublisher.publishToAllUsers).toHaveBeenCalledWith({ odds: { choice1: 10 }, drawId: 2 });
            });

            it.each(testCases)("should call roundResultConsumer.generateServerSeedAndPublishHash", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.roundResultConsumer.generateServerSeedAndPublishHash).toHaveBeenCalled();
            });

            const remainingTimeStartingNewRound = 131;
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
                expect(consumer.gameData.odds).toEqual({ choice1: 1 });
            });

            it("should call bot reset", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.bot.reset).toHaveBeenCalled();
            });

            it("should publish new turn data", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;
                consumer.gameData.drawId = 3;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.runningRoundInfoPublisher.publishToAllUsers).toHaveBeenCalledWith({ odds: { choice1: 1 }, drawId: 3 });
            });

            it("should call roundResultConsumer.generateServerSeedAndPublishHash", async () => {
                // arrange
                consumer.gameData.remainingTime = remainingTimeStartingNewRound;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.roundResultConsumer.generateServerSeedAndPublishHash).toHaveBeenCalled();
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
            const testCases = [{ remainingTime: 3 }, { remainingTime: 38 }, { remainingTime: 73 }, { remainingTime: 108 }];
            it.each(testCases)("should call gameStatusPublisher.publishEndPlacingBetStatus", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // assert
                expect(consumer.gameStatusPublisher.publishEndPlacingBetStatus).toHaveBeenCalled();
            });
        });

        describe("when starting generate result time", () => {
            beforeEach(() => {
                consumer.appConfigs.enabledBoostedOdds = false;
                consumer.bot.reset = jest.fn();
                consumer.startTurn = jest.fn();
                consumer.gameStatusPublisher.publishStartPlacingBetStatus = jest.fn();
            });

            const testCases = [{ remainingTime: 0 }, { remainingTime: 35 }, { remainingTime: 70 }, { remainingTime: 105 }];

            it.each(testCases)("should call roundResultConsumer.generateResult", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // Assert
                expect(consumer.roundResultConsumer.generateResult).toHaveBeenCalled();
            });

            it.each(testCases)("should call provablyFairConsumer.updateClientSeedFromBets", async ({ remainingTime }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;

                // act
                await consumer.proceed();

                // Assert
                expect(consumer.provablyFairConsumer.updateClientSeedsFromBets).toHaveBeenCalled();
            });

            describe("when having gameData.result value", () => {
                it.each(testCases)("should call settleGameRoundConsumer.settleRound", async ({ remainingTime }) => {
                    // arrange
                    consumer.gameData.result = {};
                    consumer.gameData.remainingTime = remainingTime;

                    // act
                    await consumer.proceed();

                    // Assert
                    expect(consumer.settleGameRoundConsumer.settleRound).toHaveBeenCalled();
                });
            });

            describe("when NOT having gameData.result value", () => {
                it.each(testCases)("should NOT call settleGameRoundConsumer.settleRound", async ({ remainingTime }) => {
                    // arrange
                    consumer.logService = { logError: jest.fn() };
                    consumer.gameData.result = null;
                    consumer.gameData.remainingTime = remainingTime;

                    // act
                    await consumer.proceed();

                    // Assert
                    expect(consumer.settleGameRoundConsumer.settleRound).not.toHaveBeenCalled();
                });
            });
        });

        describe("isDuringBetTime", () => {
            beforeEach(() => {
                consumer.startTurn = jest.fn();
                consumer.roundResultConsumer.generateServerSeedAndPublishHash = jest.fn();
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
                { remainingTime: 23 },
                { remainingTime: 24 },
                { remainingTime: 25 },
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

        describe("when remainingTime === 0", () => {
            it("should reset time ", async () => {
                // arrange
                consumer.settleTurn = jest.fn();
                consumer.gameData.remainingTime = 0;
                // act
                await consumer.proceed();

                // assert
                expect(consumer.gameData.remainingTime).toBe(durations.wholeRound);
            });
        });
    });
});
