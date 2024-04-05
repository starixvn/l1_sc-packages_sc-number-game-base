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
    const userBetResultPublisher = stub<Core.BaseEventPublishers.UserBetResultPublisher>();
    const endGame = jest.fn();
    const roundsRepository = { find: (): any => {}, create: (): any => {}, findOneAndUpdate: (): any => {} };
    const betsRepository = { find: (): any => {} };
    const tempBetsRepository = { find: (): any => {} };
    const gameManagementApiClientFactory = new GameManagementApiClientFactory({});

    beforeEach(() => {
        consumer = new SettleGameRoundConsumer({
            definition: definition,
            gameData: gameData,
            roundResultPublisher: roundResultPublisher,
            userBetResultPublisher: userBetResultPublisher,
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
        const result = [
            { drawId: 1, player: 1, banker: 1 },
            { drawId: 2, player: 2, banker: 3 },
            { drawId: 3, player: 3, banker: 2 },
            { drawId: 4, player: 4, banker: 4 },
        ];
        const settlementResult = [
            { drawId: 1, player: false, banker: false, tie: true },
            { drawId: 2, player: false, banker: true, tie: false },
            { drawId: 3, player: true, banker: false, tie: false },
            { drawId: 4, player: false, banker: false, tie: true },
        ];

        const queryBets = [
            {
                uid: chance.guid(),
                banker: chance.natural(),
                playerId: chance.natural(),
                siteId: chance.natural(),
                save: jest.fn(),
                drawId: 3,
                rate: chance.natural(),
                odds: { player: 1.96, banker: 1.96, tie: 10 },
            },
            {
                uid: chance.guid(),
                player: chance.natural(),
                playerId: chance.natural(),
                siteId: chance.natural(),
                save: jest.fn(),
                drawId: 2,
                rate: chance.natural(),
                odds: { player: 1.9, banker: 1.9, tie: 15 },
            },
            {
                uid: chance.guid(),
                player: chance.natural(),
                playerId: chance.natural(),
                siteId: chance.natural(),
                save: jest.fn(),
                drawId: 1,
                rate: chance.natural(),
                odds: { player: 1.86, banker: 1.86, tie: 20 },
            },
        ];

        const betResult = {
            totalBetAmount: chance.natural(),
            totalWin: chance.natural(),
            netWin: chance.natural(),
            totalLost: chance.natural(),
            winningByChoices: {},
        };

        const settleBetParams = {
            result: { drawId: 1, player: 1, banker: 1 },
            settlementResult: { drawId: 1, player: false, banker: false, tie: true },
            roundId: 1,
            drawId: 4,
            time: new Date(),
            isLastDraw: true,
        };

        beforeEach(() => {
            definition.choices = ["player", "banker", "tie"];
            definition.generateResult.mockReturnValueOnce(result);
            definition.settle.mockReturnValueOnce(settlementResult);
            jest.spyOn(roundsRepository, "create")
                .mockReturnThis()
                .mockReturnValue({
                    exec: jest.fn().mockReturnValue({ id: 1, result, settlementResult }),
                });
            consumer.callEndGame = jest.fn();
            jest.spyOn(consumer, "queryBets").mockImplementation(async () => queryBets);
            consumer.calculateBetResult = jest.fn(() => betResult);
            consumer.captureBetResult = jest.fn();
        });

        it("should call queryBets with drawId", async () => {
            // Act
            await consumer.settleBets(settleBetParams);

            // Assert
            expect(consumer.queryBets).toHaveBeenCalledWith(settleBetParams.drawId);
        });

        Object.keys(queryBets)
            .map((index) => +index)
            .forEach((betIndex) => {
                describe(`with bet ${betIndex + 1}`, () => {
                    it("should call calculateBetResult", async () => {
                        //Arrange
                        const settlementDrawResult = { player: false, banker: false, tie: true };

                        // Act
                        await consumer.settleBets(settleBetParams);

                        // Assert
                        expect(consumer.calculateBetResult).toHaveBeenNthCalledWith(
                            betIndex + 1,
                            settlementDrawResult,
                            queryBets[betIndex],
                            queryBets[betIndex].odds
                        );
                    });

                    it("should call endGame", async () => {
                        // Act
                        await consumer.settleBets(settleBetParams);

                        // Assert
                        expect(consumer.callEndGame).toHaveBeenNthCalledWith(
                            betIndex + 1,
                            queryBets[betIndex],
                            settleBetParams.drawId,
                            settleBetParams.time,
                            betResult
                        );
                    });

                    it("should call captureBetResult", async () => {
                        // Act
                        await consumer.settleBets(settleBetParams);

                        // Assert
                        expect(consumer.captureBetResult).toHaveBeenNthCalledWith(
                            betIndex + 1,
                            queryBets[betIndex].uid,
                            betResult,
                            queryBets[betIndex].rate
                        );
                    });

                    it("should publish bet result to user", async () => {
                        // Act
                        await consumer.settleBets(settleBetParams);

                        // Assert
                        expect(userBetResultPublisher.publish).toHaveBeenNthCalledWith(betIndex + 1, queryBets[betIndex].uid, betResult);
                    });
                });
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
