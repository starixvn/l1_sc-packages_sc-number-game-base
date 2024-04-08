import { stub } from "jest-auto-stub";
import { GameData } from "../../../src";
import HttpRouter from "../../../src/routers/http-router";
import { HistoryQuery } from "../../../src/query-apis";
import { MetricQuery } from "sc-game-base/src/core/query-apis";
import { logger } from "sc-common";
import { TableHttpRouter } from "sc-game-base/src/table/routers";

describe("HttpRouter", () => {
    const appConfigs = {
        apiSettings: {
            authUrl: "http://localhost",
        },
        authenticateSettings: {
            audiences: [],
        },
    };

    const gameData = stub<GameData>();
    const historyQuery = stub<HistoryQuery>();
    const metricQuery = stub<MetricQuery>();
    const logService = stub(logger);
    let router: HttpRouter;

    beforeEach(() => {
        router = new HttpRouter(appConfigs, gameData, historyQuery, metricQuery, logService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("inherit TableHttpRouter", () => {
        expect(router instanceof TableHttpRouter);
    });

    describe("collectOnlineUsers", () => {
        it("should calls super", () => {
            // arrange
            jest.spyOn(TableHttpRouter.prototype, "collectOnlineUsers");
            gameData.players = {
                1: { name: "bot1", type: true, red: 1000 },
                2: { name: "bot2", type: true, red: 1000 },
            };

            // act
            router.collectOnlineUsers();

            // assert
            expect(TableHttpRouter.prototype.collectOnlineUsers).toHaveBeenCalled();
        });

        it("should returns correct data", () => {
            // arrange
            gameData.players = {
                123: {},
                456: {},
            };

            const users = {
                realUsers: [
                    { id: 1, name: "user1", isTestCurrency: false, UID: 123 },
                    { id: 2, name: "user2", isTestCurrency: false, UID: 234 },
                ],
                testUsers: [
                    { id: 3, name: "user3", isTestCurrency: true, UID: 456 },
                    { id: 4, name: "user4", isTestCurrency: true, UID: 789 },
                ],
            };

            jest.spyOn(router, "mapRealUsers").mockReturnValue(users);

            const expectedResult = {
                totalRealPlayer: 1,
                realUsers: [{ id: 1, name: "user1", isTestCurrency: false }],
                totalTestPlayer: 1,
                testUsers: [{ id: 3, name: "user3", isTestCurrency: true }],
                bots: [],
                totalBots: 0,
            };

            // act
            const actualResult = router.collectOnlineUsers();

            // assert
            expect(actualResult).toEqual(expectedResult);
        });
    });

    describe("mapRealUsers", () => {
        it("should returns correct data", () => {
            // arrange
            const socketClient = {
                connected: true,
            };
            const players = [
                {
                    session: {
                        playerName: "player1",
                        playerId: 1,
                        isTestCurrency: false,
                        characterName: "character1",
                        currencyName: "USD",
                        operatorId: "1W",
                        system: 1,
                    },
                    socketClient,
                },
                {
                    session: {
                        playerName: "player2",
                        playerId: 2,
                        isTestCurrency: true,
                        characterName: "character2",
                        currencyName: "USD",
                        operatorId: "1W",
                        system: 1,
                    },
                    socketClient,
                },
            ];

            const expectedResult = {
                testUsers: [
                    { name: "player2", id: 2, character: "character2", currency: "USD", partnerId: "1W", system: 1, operatorId: "1W" },
                ],
                realUsers: [
                    { name: "player1", id: 1, character: "character1", currency: "USD", partnerId: "1W", system: 1, operatorId: "1W" },
                ],
            };

            // act
            const actualResult = router.mapRealUsers(players);

            // assert
            expect(actualResult).toEqual(expectedResult);
        });
    });
});
