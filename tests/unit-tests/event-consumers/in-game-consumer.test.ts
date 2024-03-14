import { stub } from "jest-auto-stub";
import { InGameConsumer } from "../../../src/event-consumers";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import { Core } from "sc-game-base";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { BetCountHelper } from "../../../src/helpers";

jest.mock("../../../src/helpers", () => ({
    BetCountHelper: {
        calculateBetPercentage: jest.fn(),
        calculatePlayerBetCount: jest.fn(),
    },
}));
describe("InGameConsumer tests", () => {
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const roundQuery = stub<Core.QueryApis.RoundQuery>();
    const publisher = stub<Core.BaseEventPublishers.BaseEventPublisher>();
    const getBalance = jest.fn();
    const gameManagementApiClientFactory = stub<GameManagementApiClientFactory>();

    let consumer: InGameConsumer;

    beforeEach(() => {
        consumer = new InGameConsumer(definition, gameData, roundQuery, publisher, getBalance, gameManagementApiClientFactory);
    });

    describe("buildPayload", () => {
        it("should return expected when game not disabled", async () => {
            // arrange
            const player = { UID: "1" };
            consumer.getUserInfo = jest.fn().mockReturnValue(player);
            const roundId = 1;
            const roundHistory = [
                {
                    roundId,
                    drawId: 2,
                    result: { drawId: 2, choice1: 7, choice2: 5 },
                    settlementResult: { drawId: 2, choice1: true, choice2: false },
                },
                {
                    roundId,
                    drawId: 1,
                    result: { drawId: 1, choice1: 3, choice2: 4 },
                    settlementResult: { drawId: 1, choice1: false, choice2: true },
                },
            ];
            consumer.roundQuery.getList = jest.fn().mockReturnValue(roundHistory);
            const totalBets = { choice1: 1 };
            consumer.gameData.roundId = roundId;
            (consumer.gameData as GameData).drawId = 2;
            const odds = { choice1: 2, choice2: 2 };
            (consumer.gameData as GameData).odds = odds;
            consumer.gameData.totalBets = totalBets;
            const players: any[] = [];
            consumer.buildPlayersPayload = jest.fn().mockReturnValue(players);
            const gameConfigs = { odds: { choice1: 0, choice2: 0 }, enableFreeBet: false, enabled: true, margin: "0" };
            consumer.gameData.gameConfigs = gameConfigs as any;
            const currencyGroupGames = [{ groupId: "group", maxBet: { choice1: 2000, choice2: 2000 } }];
            consumer.gameData.currencyGroupGames = currencyGroupGames;
            const exchangeRates = { code: { USD: 1 } };
            consumer.gameData.exchangeRates = exchangeRates;
            consumer.gameData.ingame = {};
            const realPlayer = { profile: { name: "player" }, session: { currencyCode: "USD", multiplier: 1, currencyGroupId: "group" } };
            consumer.gameData.remainingTime = 60;
            consumer.getResultHash = jest.fn().mockReturnValue({});
            (BetCountHelper.calculateBetPercentage as jest.Mock).mockReturnValueOnce({ choice1: 100 });
            (BetCountHelper.calculatePlayerBetCount as jest.Mock).mockReturnValueOnce({ choice1: 1 });
            consumer.getOddsRange = jest.fn().mockReturnValue({});
            const expected = {
                roundId,
                roundData: { drawId: 2 },
                odds,
                drawId: 2,
                oddsRange: {},
                gameConfigs: {
                    maxBet: { choice1: 2000, choice2: 2000 },
                    margin: gameConfigs.margin,
                    enableFreeBet: gameConfigs.enableFreeBet,
                    boostedChoices: undefined,
                    groupId: "group",
                    originalOdds: undefined,
                },
                roundHistory,
                ownBets: {},
                totalBets,
                user: { ...player, rate: 1 },
                resultHash: {},
                players,
                betPercentage: { choice1: 100 },
                playerBetCount: { choice1: 1 },
                remainingTime: 60,
            };

            // act
            const actual = await consumer.buildPayload(realPlayer);

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
