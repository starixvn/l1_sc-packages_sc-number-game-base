import { stub } from "jest-auto-stub";
import { GameData, GameDefinition } from "../../../src";
import { RoundQuery } from "../../../src/query-apis";
import SocketRouter from "../../../src/routers/socket-router";
import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { Chance } from "chance";
import { UserRateLimiter } from "../../../src/rate-limiters";
import { logger } from "sc-common";

describe("SocketRounter tests", () => {
    const chance = new Chance();
    const gameData = stub<GameData>();
    const definition = stub<GameDefinition>();
    const roundQuery = stub<RoundQuery>();
    const userRateLimiter = stub<UserRateLimiter>();
    const logService = stub(logger);

    let router: SocketRouter;
    beforeEach(() => {
        //@ts-ignore
        router = new SocketRouter({ gameData, definition, roundQuery, userRateLimiter, logService });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("init", () => {
        it("should run correctly", () => {
            // arrange
            BaseSocketRouter.prototype.init = jest.fn();
            router.socketClient = { on: jest.fn() } as any;
            router.getLobbyData = jest.fn();

            // act
            router.init({} as any);

            // assert
            expect(router.socketClient.on).toHaveBeenCalledWith("getLobbyData", expect.any(Function));
        });
    });

    describe("getLobbyData", () => {
        beforeEach(() => {
            router.socketClient = { emit: jest.fn(), disconnect: jest.fn(), id: "socketId" } as any;
        });

        describe("when authenticated", () => {
            it("should call userRateLimiter.verify", async () => {
                // arrange
                BaseSocketRouter.prototype.verify = jest.fn().mockReturnValue(true);
                userRateLimiter.verify = jest.fn().mockReturnValue(true);

                // act
                await router.getLobbyData();

                // assert
                expect(userRateLimiter.verify).toHaveBeenCalled();
            });
        });

        describe("when unauthenticated", () => {
            it("should not return anything", async () => {
                // arrange
                router.verify = jest.fn().mockReturnValue(false);

                // act
                await router.getLobbyData();

                // assert
                expect(router.socketClient.emit).not.toHaveBeenCalled();
            });
        });
        describe("when game is disabled", () => {
            it("should not return anything", async () => {
                // arrange
                router.verify = jest.fn().mockReturnValue(true);
                router.gameData.disabled = true;

                // act
                await router.getLobbyData();

                // assert
                expect(router.socketClient.emit).not.toHaveBeenCalled();
            });
        });

        describe("when game is enabled", () => {
            it("should return expected", async () => {
                // arrange
                router.verify = jest.fn().mockReturnValue(true);
                router.gameData.disabled = false;
                router.roundQuery.getList = jest.fn().mockReturnValue([{ drawId: 1 }]);
                const players = { "1": { name: "player" } };
                router.gameData.players = players;
                router.gameData.remainingTime = 10;
                router.definition.name = "game1";
                router.gameData.realPlayers["socketId"] = {
                    profile: {
                        name: "player",
                        minBet: 10,
                        maxBet: 100,
                    },
                    session: {
                        currencyGroupId: "1",
                    },
                };
                router.gameData.currencyGroupGames = [{ groupId: 1, minBet: 1, maxBet: 100 }];

                // act
                await router.getLobbyData();

                // assert
                expect(router.socketClient.emit).toHaveBeenCalledWith("game1", {
                    players,
                    roundHistory: [{ drawId: 1 }],
                    remainingTime: 10,
                    betLimit: { minBet: 10, maxBet: 100 },
                });
            });
        });

        describe("when there is an error", () => {
            it("should log error", async () => {
                // arrange
                const error = new Error("error");
                router.verify = jest.fn().mockImplementation(() => {
                    throw error;
                });
                router.logService = { logError: jest.fn() };

                // act
                await router.getLobbyData();

                // assert
                expect(router.logService.logError).toHaveBeenCalledWith(error);
            });
        });
    });

    describe("getPfInfo", () => {
        const payload = {
            drawId: 1,
        };

        const clientId = chance.natural();

        beforeEach(() => {
            definition.numberOfTurnsPerRound = 4;
            gameData.roundId = 1;
            gameData.drawId = 1;
            payload.drawId = 1;
            router.socketClient = { emit: jest.fn(), id: clientId } as any;
            gameData.realPlayers[clientId] = {
                profile: {
                    name: "player1",
                },
            };
            gameData.ingame["player1"] = {
                clientSeedDetail: {
                    clientSeed: "1234",
                    useManual: true,
                },
            };
        });

        describe("when not having provably fair", () => {
            it("should not return anything", async () => {
                // arrange
                definition.provablyFair = false;
                router.verify = jest.fn().mockReturnValue(true);

                // act
                await router.getPfInfo(payload);

                // assert
                expect(router.socketClient.emit).not.toHaveBeenCalled();
            });
        });

        describe("when unauthenticated", () => {
            it("should not return anything", async () => {
                // arrange
                router.verify = jest.fn().mockReturnValue(false);

                // act
                await router.getPfInfo(payload);

                // assert
                expect(router.socketClient.emit).not.toHaveBeenCalled();
            });
        });

        describe("when authenticated & having provably fair", () => {
            it("should call userRateLimiter.verify", async () => {
                // arrange
                payload.drawId = 2;
                gameData.drawId = 1;
                definition.provablyFair = true;
                userRateLimiter.verify = jest.fn().mockReturnValue(true);
                BaseSocketRouter.prototype.verify = jest.fn().mockReturnValue(true);

                // act
                await router.getPfInfo(payload);

                // assert
                expect(userRateLimiter.verify).toHaveBeenCalled();
            });
        });

        describe("when there is an error", () => {
            it("should log error", async () => {
                // arrange
                const error = new Error("error");
                router.verify = jest.fn().mockImplementation(() => {
                    throw error;
                });
                router.logService = { logError: jest.fn() };

                // act
                await router.getLobbyData();

                // assert
                expect(router.logService.logError).toHaveBeenCalledWith(error);
            });
        });

        describe("when payload.drawId > gameData.drawId", () => {
            it("should not return anything", async () => {
                // arrange
                definition.provablyFair = true;
                router.verify = jest.fn().mockReturnValue(true);
                payload.drawId = 2;
                gameData.drawId = 1;

                // act
                await router.getPfInfo(payload);

                // assert
                expect(router.socketClient.emit).not.toHaveBeenCalled();
            });
        });

        describe("when all conditions are valid", () => {
            const testCases = [
                {
                    drawId: 1,
                    roundId: 1,
                },
                {
                    drawId: 2,
                    roundId: 1,
                },
                {
                    drawId: 3,
                    roundId: 1,
                },
                {
                    drawId: 4,
                    roundId: 1,
                },
                {
                    drawId: 5,
                    roundId: 2,
                },
            ];
            it.each(testCases)("should call roundQuery.getPfInfo", async ({ drawId, roundId }) => {
                // arrange
                payload.drawId = drawId;
                definition.provablyFair = true;
                gameData.roundId = roundId;
                gameData.drawId = drawId;
                router.verify = jest.fn().mockReturnValue(true);

                // act
                await router.getPfInfo(payload);

                // assert
                expect(roundQuery.getPfInfo).toHaveBeenCalledWith(payload.drawId, roundId);
            });

            it("should emit correct data", async () => {
                // arrange
                const pfResult = {
                    roundId: chance.natural(),
                    drawId: chance.natural(),
                    serverSeedHash: "serverSeedHash",
                    encryptedServerSeed: {},
                    finalHash: "finalHash",
                    clientSeeds: ["1", "2", "3", "4"],
                };

                definition.provablyFair = true;
                definition.name = "numberGame";
                router.verify = jest.fn().mockReturnValue(true);
                roundQuery.getPfInfo = jest.fn().mockReturnValue(pfResult);

                const pfInfo = {
                    pfResult: pfResult,
                    clientSeedDetail: {
                        clientSeed: "1234",
                        useManual: true,
                    },
                };

                // act
                await router.getPfInfo(payload);

                // assert
                expect(router.socketClient.emit).toHaveBeenCalledWith("numberGame", pfInfo);
            });
        });
    });

    describe("handlePlaceBet", () => {
        const payload = {};

        beforeEach(() => {
            BaseSocketRouter.prototype.verify = jest.fn().mockReturnValue(false);
            router.verify = jest.fn();
        });
        it("should call base verify", async () => {
            // act
            router.handlePlaceBet(payload);

            // assert
            expect(BaseSocketRouter.prototype.verify).toHaveBeenCalled();
        });

        it("should NOT call verify", async () => {
            // act
            router.handlePlaceBet(payload);

            // assert
            expect(router.verify).not.toHaveBeenCalled();
        });

        it("should NOT userRateLimiter.verify", async () => {
            // act
            router.handlePlaceBet(payload);

            // assert
            expect(userRateLimiter.verify).not.toHaveBeenCalled();
        });
    });

    describe("verify", () => {
        const clientId = chance.natural();

        beforeEach(() => {
            router.socketClient = { emit: jest.fn(), id: clientId, disconnect: jest.fn() } as any;
            gameData.realPlayers[clientId] = {
                profile: {
                    name: "player1",
                },
            };
            BaseSocketRouter.prototype.verify = jest.fn().mockReturnValue(true);
            logService.logError = jest.fn();
        });

        it("should call userRateLimiter.verify", () => {
            // Act
            router.verify();

            // Assert
            expect(userRateLimiter.verify).toHaveBeenCalled();
        });

        describe("when rate limit exceeded", () => {
            beforeEach(() => {
                userRateLimiter.verify = jest.fn().mockReturnValue(false);
                userRateLimiter.interval = 1000;
            });

            it("should call userRateLimiter logError", () => {
                // Arrange
                const errorMessage = `Rate limit exceeded; request rejected. Request again after 1 seconds`;

                // Act
                router.verify();

                // Assert
                expect(logService.logError).toHaveBeenCalledWith(errorMessage);
            });
        });
    });
});
