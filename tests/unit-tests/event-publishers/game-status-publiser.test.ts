import Chance from "chance";
import { GameStatusPublisher } from "../../../src/event-publishers";
import GameData from "../../../src/game-data";
import { stub } from "jest-auto-stub";
import { GameConfigs } from "sc-game-base/src/core/game-data";

describe("GameStatusPublisher test", () => {
    let publisher: GameStatusPublisher;
    const gameData = stub<GameData>();
    const chance = new Chance();
    gameData.currencyGroupGames = [];
    gameData.currencies = [];
    gameData.exchangeRates = [];
    gameData.realPlayers = {
        1: {
            UID: 1,
            socketClient: {
                connected: true,
                emit: jest.fn(),
            },
        },
        2: {
            UID: 2,
            socketClient: {
                connected: true,
                emit: jest.fn(),
            },
        },
    };

    gameData.admins = {
        1: {
            UID: 1,
            socketClient: {
                connected: true,
                emit: jest.fn(),
            },
        },
        2: {
            UID: 2,
            socketClient: {
                connected: true,
                emit: jest.fn(),
            },
        },
    };
    gameData.remainingTime = 10;
    gameData.roundId = 10;
    gameData.gameConfigs = {
        odds: {},
        originalOdds: {},
        enableFreeBet: false,
        margin: {},
        maxWinPerRound: 100,
    } as GameConfigs;

    gameData.umMessages = { "en-US": "UM" };

    beforeEach(() => {
        publisher = new GameStatusPublisher("numberGame", gameData);
    });

    describe("publishEnablingGameStatus", () => {
        beforeEach(() => {
            publisher.publishToAllUsers = jest.fn();
            publisher.publishToAllAdmins = jest.fn();
            publisher.getOddsRange = jest.fn().mockReturnValue({
                min: 10,
                max: 100,
            });
        });
        it("should send to admin clients", () => {
            // Act
            publisher.publishEnablingGameStatus();

            // Assert
            expect(publisher.publishToAllAdmins).toHaveBeenCalledWith({
                remainingTime: 10,
                roundId: 10,
                currencies: [],
                exchangeRates: [],
            });
        });

        it("should emit to player with correct payload", () => {
            // Arrange
            const realPlayers = Object.values(gameData.realPlayers);
            const expectedPayload = {
                gameConfigs: {
                    enableFreeBet: false,
                    maxWinPerRound: 100,
                    odds: {},
                    oddsRange: { min: 10, max: 100 },
                    originalOdds: {},
                },
                remainingTime: 10,
                snr: true,
            };
            // Act
            publisher.publishEnablingGameStatus();

            // Assert
            realPlayers.forEach((realPlayer: any) => {
                expect(realPlayer.socketClient.emit).toHaveBeenCalledWith("numberGame", expectedPayload);
            });
        });
    });
});
