import { stub } from "jest-auto-stub";
import { GameData, GameDefinition } from "../../../src";
import { RoundQuery } from "../../../src/query-apis";
import SocketRouter from "../../../src/routers/socket-router";
import { BaseSocketRouter } from "sc-game-base/src/core/routers";

describe("SocketRounter tests", () => {
    const gameData = stub<GameData>();
    const definition = stub<GameDefinition>();
    const roundQuery = stub<RoundQuery>();
    let router: SocketRouter;
    beforeEach(() => {
        //@ts-ignore
        router = new SocketRouter({ gameData, definition, roundQuery });
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
            router.socketClient = { emit: jest.fn() } as any;
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

                // act
                await router.getLobbyData();

                // assert
                expect(router.socketClient.emit).toHaveBeenCalledWith("game1", {
                    players,
                    roundHistory: [{ drawId: 1 }],
                    remainingTime: 10,
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
});
