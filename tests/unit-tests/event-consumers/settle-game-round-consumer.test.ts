import { Table, Core } from "sc-game-base";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import { RoundResultPublisher } from "../../../src/event-publishers";
import { SettleGameRoundConsumer } from "../../../src/event-consumers";
import { stub } from "jest-auto-stub";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import Chance from "chance";
import { FinishDraw } from "../../../src/event-consumers/settle-game-round-consumer";

describe("SettleGameRoundConsumer test", () => {
    const chance = new Chance();
    let consumer: SettleGameRoundConsumer;
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const roundResultPublisher = stub<RoundResultPublisher>();
    const userBetResultPublisher = stub<Core.BaseEventPublishers.UserBetResultPublisher>({
        publish: jest.fn(),
        publishApiError: jest.fn(),
        logService: { logError: jest.fn() },
        publishToUser: jest.fn(),
        gameName: "test-game",
        gameData: {},
    });
    const endGame = jest.fn();
    const roundsRepository = { find: (): any => {}, create: (): any => {}, findOneAndUpdate: (): any => {} };
    const betsRepository = { find: (): any => {} };
    const tempBetsRepository = { find: (): any => {} };
    const gameManagementApiClientFactory = new GameManagementApiClientFactory({});

    beforeEach(() => {
        jest.clearAllMocks();
        consumer = new SettleGameRoundConsumer({
            definition: definition,
            gameData: gameData,
            roundResultPublisher: roundResultPublisher,
            userBetResultPublisher: userBetResultPublisher as any,
            endGame: endGame,
            roundsRepository: roundsRepository,
            betsRepository: betsRepository,
            tempBetsRepository: tempBetsRepository,
            gameManagementApiClientFactory: gameManagementApiClientFactory,
        });
    });

    it("Inherit Table.EventConsumers.TableSettleGameRoundConsumer", () => {
        expect(consumer instanceof Table.EventConsumers.TableSettleGameRoundConsumer).toBeTruthy();
    });

    describe("settleRound", () => {
        const drawResult = { player: 10, banker: 2 };
        const drawSettlementResult = { player: true, banker: false, tie: false };
        const mockDate = new Date();
        const roundId = chance.natural();
        const drawId = chance.natural();
        const createResult = {
            id: roundId,
            drawId: drawId,
            result: [drawResult],
            settlementResult: [drawSettlementResult],
            time: mockDate,
            exchangeRateId: 1,
            ended: false,
        };
        const winningPlayers = { user: "player1" };

        beforeEach(() => {
            gameData.roundId = roundId;
            gameData.drawId = drawId;
            gameData.result = drawResult;
            gameData.exchangeRates = { exId: 1 };
            definition.settle.mockReturnValue(drawSettlementResult);
            consumer.settleBets = jest.fn();
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);
            roundsRepository.create = jest.fn().mockReturnValue(createResult);
            roundsRepository.findOneAndUpdate = jest.fn().mockReturnValue(createResult);
            roundResultPublisher.publishRoundResult = jest.fn();
            consumer.updateRoundData = jest.fn();
            consumer.settleBets = jest.fn();
            roundResultPublisher.publishWinners = jest.fn();
            gameData.winningPlayers = winningPlayers;
        });

        it("should call settle with drawResult", async () => {
            // Act
            await consumer.settleRound();

            // Assert
            expect(definition.settle).toHaveBeenCalledWith(drawResult);
        });

        describe("when isFirstDrawOfRound", () => {
            it("should call roundsRepository.create", async () => {
                // Arrange
                consumer.isFirstDrawOfRound = jest.fn(() => true);

                // Act
                await consumer.settleRound();

                // Assert
                expect(roundsRepository.create).toHaveBeenCalledWith(createResult);
            });
        });

        describe("when isLastDrawOfRound", () => {
            it("should call roundsRepository.findOneAndUpdate", async () => {
                // Arrange
                consumer.isFirstDrawOfRound = jest.fn(() => false);
                consumer.isLastDrawOfRound = jest.fn(() => true);
                const filter = { id: roundId };
                const update = {
                    $push: { result: drawResult, settlementResult: drawSettlementResult },
                    $set: { drawId: drawId, ended: true },
                };
                const opts = { new: true };

                // Act
                await consumer.settleRound();

                // Assert
                expect(roundsRepository.findOneAndUpdate).toHaveBeenCalledWith(filter, update, opts);
            });
        });

        it("should call roundResultPublisher.publishRoundResult", async () => {
            //Arrange
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundId,
                drawId: drawId,
                time: mockDate,
                isLastDraw: false,
            };

            // Act
            await consumer.settleRound();

            // Assert
            expect(roundResultPublisher.publishRoundResult).toHaveBeenCalledWith(finishDraw);
        });

        it("should call updateRoundData", async () => {
            //Arrange
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundId,
                drawId: drawId,
                time: mockDate,
                isLastDraw: false,
            };

            // Act
            await consumer.settleRound();

            // Assert
            expect(consumer.updateRoundData).toHaveBeenCalledWith(finishDraw, createResult.result);
        });

        it("should call settleBets", async () => {
            //Arrange
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundId,
                drawId: drawId,
                time: mockDate,
                isLastDraw: false,
            };

            // Act
            await consumer.settleRound();

            // Assert
            expect(consumer.settleBets).toHaveBeenCalledWith(finishDraw);
        });

        it("should call roundResultPublisher.publishWinners", async () => {
            //Arrange
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundId,
                drawId: drawId,
                time: mockDate,
                isLastDraw: false,
            };

            // Act
            await consumer.settleRound();

            // Assert
            expect(roundResultPublisher.publishWinners).toHaveBeenCalledWith(roundId, winningPlayers, drawId);
        });
    });

    describe("queryBets", () => {
        it("should return correct result", async () => {
            // arrange
            const realPlayerBets = [{ drawId: 1, choice: "player", amount: 10 }];
            const botBets = [{ drawId: 1, choice: "banker", amount: 1 }];
            const expectedResult = realPlayerBets.concat(botBets);

            jest.spyOn(betsRepository, "find")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockReturnValue(realPlayerBets),
                });

            jest.spyOn(tempBetsRepository, "find")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockReturnValue(botBets),
                });

            // act
            const actualResult = await consumer.queryBets(1);

            // assert
            expect(actualResult).toEqual(expectedResult);
        });
    });

    describe("settleBets", () => {
        const mockDate = new Date();
        const drawId = chance.natural();
        const bet = {
            uid: "testUser123",
            odds: 2,
            rate: 1.5,
            betwin: 0,
            paid: false,
            save: jest.fn(),
        };
        const finishDraw: FinishDraw = {
            drawId: drawId,
            roundId: chance.natural(),
            result: { player: 10, banker: 2 },
            settlementResult: { player: true, banker: false },
            time: mockDate,
            isLastDraw: false,
        };
        const betResult = { totalWin: 100 };

        beforeEach(() => {
            jest.clearAllMocks();
            jest.spyOn(betsRepository, "find")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockResolvedValue([bet]),
                });
            jest.spyOn(tempBetsRepository, "find")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockResolvedValue([]),
                });
            consumer.calculateBetResult = jest.fn().mockReturnValue(betResult);
            consumer.callEndGame = jest.fn().mockResolvedValue({ isOk: true });
            consumer.captureBetResult = jest.fn();
            consumer.userBetResultPublisher = userBetResultPublisher;
            definition.choices = ["player", "banker"];
        });

        it("should process bet and update bet result when API call succeeds", async () => {
            // Arrange
            const expectedBetResult = { totalWin: 100 };
            jest.spyOn(consumer, "calculateBetResult").mockReturnValue(expectedBetResult);

            // Act
            await consumer.settleBets(finishDraw);

            // Assert
            expect(bet.betwin).toBe(expectedBetResult.totalWin);
            expect(bet.paid).toBe(true);
            expect(bet.save).toHaveBeenCalled();
            expect(consumer.captureBetResult).toHaveBeenCalledWith(bet.uid, expectedBetResult, bet.rate);
            expect(userBetResultPublisher.publish).toHaveBeenCalledWith(bet.uid, expectedBetResult);
            expect(userBetResultPublisher.publishApiError).not.toHaveBeenCalled();
        });

        it("should handle API error and publish error message", async () => {
            // Arrange
            const apiError = { isOk: false, response: "API Error" };
            consumer.callEndGame = jest.fn().mockImplementation(async (bet, drawId, time, betResult) => {
                const result = apiError;
                if (!result.isOk) {
                    await userBetResultPublisher.publishApiError(bet.uid, result.response);
                }
                return result;
            });

            // Act
            await consumer.settleBets(finishDraw);

            // Assert
            expect(userBetResultPublisher.publishApiError).toHaveBeenCalledWith(bet.uid, apiError.response);
            expect(userBetResultPublisher.publish).not.toHaveBeenCalled();
            expect(consumer.captureBetResult).toHaveBeenCalledWith(bet.uid, betResult, bet.rate);
            expect(bet.save).toHaveBeenCalled();
        });

        it("should process multiple bets concurrently", async () => {
            // Arrange
            const bet2 = { ...bet, uid: "testUser456" };
            jest.spyOn(betsRepository, "find")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockResolvedValue([bet, bet2]),
                });

            // Act
            await consumer.settleBets(finishDraw);

            // Assert
            expect(consumer.callEndGame).toHaveBeenCalledTimes(2);
            expect(consumer.captureBetResult).toHaveBeenCalledTimes(2);
        });
    });

    describe("callEndGame", () => {
        const mockDate = new Date();
        const bet = {
            uid: "testUser123",
            amount: 100,
            choice: "player",
        };
        const roundId = chance.natural();
        const betResult = { totalWin: 100 };

        beforeEach(() => {
            jest.clearAllMocks();
            consumer.formatEndGameInfo = jest.fn().mockReturnValue({
                gameInfo: { amount: 100 },
                settlementInfo: { win: 100 },
            });
            consumer.userBetResultPublisher = userBetResultPublisher;
            endGame.mockReset();
        });

        it("should call endGame with formatted info and return success result", async () => {
            // Arrange
            const successResult = { isOk: true };
            endGame.mockResolvedValue(successResult);

            // Act
            const result = await consumer.callEndGame(bet, roundId, mockDate, betResult);

            // Assert
            expect(consumer.formatEndGameInfo).toHaveBeenCalledWith(bet, roundId, mockDate, betResult);
            expect(endGame).toHaveBeenCalledWith(bet.uid, { amount: 100 }, { win: 100 });
            expect(result).toBe(successResult);
        });

        it("should handle API error and publish error message", async () => {
            // Arrange
            const apiError = { isOk: false, response: "API Error" };
            endGame.mockResolvedValue(apiError);

            // Act
            const result = await consumer.callEndGame(bet, roundId, mockDate, betResult);

            // Assert
            expect(userBetResultPublisher.publishApiError).toHaveBeenCalledWith(bet.uid, apiError.response);
            expect(result).toBe(apiError);
        });
    });

    describe("isFirstDrawOfRound", () => {
        beforeEach(() => {
            consumer.definition.numberOfTurnsPerRound = 4;
        });

        describe("when draw is the first draw", () => {
            const testCases = [{ drawId: 1 }, { drawId: 5 }, { drawId: 9 }, { drawId: 13 }, { drawId: 17 }];
            it.each(testCases)("should return correct", ({ drawId }) => {
                // Act
                const result = consumer.isFirstDrawOfRound(drawId);

                // Assert
                expect(result).toBe(true);
            });
        });

        describe("when draw is not the first draw", () => {
            const testCases = [{ drawId: 2 }, { drawId: 3 }, { drawId: 8 }, { drawId: 11 }, { drawId: 15 }];
            it.each(testCases)("should return correct", ({ drawId }) => {
                // Act
                const result = consumer.isFirstDrawOfRound(drawId);

                // Assert
                expect(result).toBe(false);
            });
        });
    });

    describe("isLastDrawOfRound", () => {
        beforeEach(() => {
            consumer.definition.numberOfTurnsPerRound = 4;
        });

        describe("when draw is the last draw", () => {
            const testCases = [{ drawId: 4 }, { drawId: 8 }, { drawId: 12 }, { drawId: 16 }, { drawId: 20 }];
            it.each(testCases)("should return correct", ({ drawId }) => {
                // Act
                const result = consumer.isLastDrawOfRound(drawId);

                // Assert
                expect(result).toBe(true);
            });
        });

        describe("when draw is not the first draw", () => {
            const testCases = [{ drawId: 2 }, { drawId: 3 }, { drawId: 7 }, { drawId: 11 }, { drawId: 15 }];
            it.each(testCases)("should return correct", ({ drawId }) => {
                // Act
                const result = consumer.isLastDrawOfRound(drawId);

                // Assert
                expect(result).toBe(false);
            });
        });
    });

    describe("updateRoundData", () => {
        beforeEach(() => {
            consumer.gameData.drawId = 8;
            consumer.gameData.roundId = 2;
        });
        const finishDraw = {
            roundId: 2,
            drawId: 8,
            isLastDraw: true,
        };

        const roundResult = [
            {
                player: 1,
                banker: 3,
                drawId: 5,
            },
        ];
        describe("when draw is the last draw", () => {
            it("should update correct", () => {
                // Arrange
                consumer.isLastDrawOfRound = jest.fn(() => true);

                // Act
                consumer.updateRoundData(finishDraw as FinishDraw, roundResult);

                // Assert
                expect(consumer.gameData.drawId).toBe(9);
                expect(consumer.gameData.roundId).toBe(3);
            });
        });

        describe("when draw is NOT the last draw", () => {
            it("should update correct", () => {
                // Arrange
                consumer.isLastDrawOfRound = jest.fn(() => false);

                // Act
                consumer.updateRoundData(finishDraw as FinishDraw, roundResult);

                // Assert
                expect(consumer.gameData.drawId).toBe(9);
                expect(consumer.gameData.roundId).toBe(2);
            });
        });
    });
});
