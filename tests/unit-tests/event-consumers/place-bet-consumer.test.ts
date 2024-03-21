import { Core } from "sc-game-base";
import { PlaceBetConsumer } from "../../../src/event-consumers";
import { stub } from "jest-auto-stub";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";

jest.mock("sc-common", () => ({
    helpers: {
        noticeHelper: {
            invalidBet: "invalidBet",
            cannotPlaceBet: "cannotPlaceBet",
            minBet: "minBet",
            maxBet: "maxBet",
            disallowHedgeBet: "disallowHedgeBet",
        },
    },
}));

describe("PlaceBetConsumer test", () => {
    let consumer: PlaceBetConsumer;
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const publisher = stub<Core.BaseEventPublishers.BaseEventPublisher>();
    beforeEach(() => {
        consumer = new PlaceBetConsumer(definition, gameData, publisher);
    });

    describe("composeBettingTimeValidationCriteria", () => {
        beforeEach(() => {
            consumer.getNoticeObj = jest.fn((key) => key);
            consumer.gameData.gameConfigs = {} as any;
            consumer.gameData.remainingTime = 1;
            consumer.definition.durations = {
                wholeRound: 134,
                placingBets: 25,
                lockingBet: 3,
                showingResult: 5,
                wholeTurn: 33,
                startingRound: 2,
            } as any;
            (consumer.definition as any).numberOfTurnsPerRound = 4;
        });
        it("should return failure when game is disabled", () => {
            // arrange
            consumer.gameData.gameConfigs.enabled = false;

            // act
            const actual = consumer.composeBettingTimeValidationCriteria(1)[0];

            // assert
            expect(actual.failure).toBe(true);
            expect(actual.notice).toBe("invalidBet");
        });

        describe("when game show results", () => {
            const testCases = [
                { remainingTime: 25, drawId: 8 },
                { remainingTime: 26, drawId: 8 },
                { remainingTime: 58, drawId: 7 },
                { remainingTime: 63, drawId: 7 },
                { remainingTime: 91, drawId: 6 },
                { remainingTime: 95, drawId: 6 },
                { remainingTime: 124, drawId: 5 },
                { remainingTime: 128, drawId: 5 },
            ];
            it.each(testCases)("should return failure", ({ remainingTime, drawId }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                (consumer.gameData as any).drawId = drawId;

                // act
                const actual = consumer.composeBettingTimeValidationCriteria(1)[1];

                // assert
                expect(actual.failure).toBe(true);
                expect(actual.notice).toBe("cannotPlaceBet");
            });
        });

        describe("when locking bet", () => {
            const testCases = [
                { remainingTime: 2, drawId: 8 },
                { remainingTime: 32, drawId: 8 },
                { remainingTime: 35, drawId: 7 },
                { remainingTime: 65, drawId: 7 },
                { remainingTime: 68, drawId: 6 },
                { remainingTime: 99, drawId: 6 },
                { remainingTime: 100, drawId: 5 },
                { remainingTime: 130, drawId: 5 },
            ];
            it.each(testCases)("should return failure", ({ remainingTime, drawId }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                (consumer.gameData as any).drawId = drawId;

                // act
                const actual = consumer.composeBettingTimeValidationCriteria(1)[2];

                // assert
                expect(actual.failure).toBe(true);
                expect(actual.notice).toBe("SB1941");
            });
        });

        describe("should valid bet", () => {
            const testCases = [
                { remainingTime: 4, drawId: 8 },
                { remainingTime: 24, drawId: 8 },
                { remainingTime: 37, drawId: 7 },
                { remainingTime: 57, drawId: 7 },
                { remainingTime: 70, drawId: 6 },
                { remainingTime: 90, drawId: 6 },
                { remainingTime: 103, drawId: 5 },
                { remainingTime: 120, drawId: 5 },
            ];
            it.each(testCases)("should return failure", ({ remainingTime, drawId }) => {
                // arrange
                consumer.gameData.remainingTime = remainingTime;
                (consumer.gameData as any).drawId = drawId;

                // act
                const actual = consumer.composeBettingTimeValidationCriteria(1);

                // assert
                expect(actual[1].failure).toBe(false);
                expect(actual[2].failure).toBe(false);
            });
        });
    });
    describe("composeBetAmountValidationCriteria", () => {
        const player = { profile: { name: "user", minBet: 10, maxBet: 50 }, session: { currencyGroupId: "A" } };
        beforeEach(() => {
            consumer.getNoticeObj = jest.fn((key) => key);
            consumer.anyChoiceExceedItsMaxBet = jest.fn().mockReturnValue(false);
            consumer.anyChoiceBelowMinBet = jest.fn().mockReturnValue(false);
            consumer.anyChoiceExceedItsMaxWin = jest.fn().mockReturnValue(false);
            consumer.gameData.currencyGroupGames = [{ groupId: player.session.currencyGroupId, minBet: 10, maxBet: 50 }];
            consumer.gameData.gameConfigs = {} as any;
        });
        it("should return failure when freeBet is true", () => {
            // arrange
            consumer.gameData.gameConfigs.enableFreeBet = false;

            // act
            const actual = consumer.composeBetAmountValidationCriteria(player, {}, 0, true)[0];

            // assert
            expect(actual.failure).toBe(true);
            expect(actual.notice).toBe("invalidBet");
        });

        it("should return failure when totalAmountOfExistingBets + totalAmount < minBet", () => {
            // arrange
            consumer.gameData.ingame = { [player.profile.name]: { betTracks: { player: 1, tie: 1 } } };
            const betChoices = { player: 5 };

            // act
            const actual = consumer.composeBetAmountValidationCriteria(player, betChoices as any, 5, false)[3];

            // assert
            expect(actual.failure).toBe(true);
            expect(actual.notice).toBe("minBet");
        });

        it("should return failure when totalAmount > maxBet", () => {
            // act
            const actual = consumer.composeBetAmountValidationCriteria(player, {}, 55, false)[4];

            // assert
            expect(actual.failure).toBe(true);
            expect(actual.notice).toBe("maxBet");
        });

        it("should return failure when totalAmountOfExistingBets + totalAmount > maxBet", () => {
            // arrange
            consumer.gameData.ingame = { [player.profile.name]: { betTracks: { player: 10, tie: 10 } } };

            // act
            const actual = consumer.composeBetAmountValidationCriteria(player, { player: 40 }, 40, false)[5];

            // assert
            expect(actual.failure).toBe(true);
            expect(actual.notice).toBe("maxBet");
        });

        it("should return false when valid bets", () => {
            // arrange
            consumer.gameData.ingame = { [player.profile.name]: { betTracks: { player: 10, tie: 10 } } };

            // act
            const actual = consumer.composeBetAmountValidationCriteria(player, { player: 10 }, 10, false);

            // assert
            expect(actual.filter((e) => e.failure)).toHaveLength(0);
        });
    });
    describe("composeBetChoiceValidationCriteria", () => {
        const testCases = [
            { betChoices: { player: 20, tie: 20 }, expected: false },
            { betChoices: { tie: 20, banker: 10 }, expected: false },
            { betChoices: { tie: 20, odd: 10 }, expected: true },
            { betChoices: { even: 10 }, expected: true },
        ];

        it.each(testCases)("should return expected", ({ betChoices, expected }) => {
            // arrange
            consumer = new PlaceBetConsumer(definition, gameData, publisher);
            consumer.definition.choices = ["player", "banker", "tie"];
            consumer.getNoticeObj = jest.fn().mockReturnValueOnce("");

            // act
            // @ts-ignore
            const actual = consumer.composeBetChoiceValidationCriteria(betChoices);

            // assert
            expect(actual[0].failure).toBe(expected);
        });
    });
    describe("composeHedgeBetValidationCriteria", () => {
        describe("when there are not hedge bets", () => {
            const testCases = [
                { betChoices: { player: 20, tie: 20 }, betTracks: {} },
                { betChoices: { player: 20 }, betTracks: { tie: 20, banker: 0 } },
                { betChoices: { tie: 20 }, betTracks: { tie: 20 } },
            ];
            it.each(testCases)("should return failure", ({ betChoices, betTracks }) => {
                // arrange
                const player = { profile: { name: "user" } };
                consumer.definition.hedgeBetGroups = [["player", "banker"]];
                consumer.gameData.ingame = { [player.profile.name]: { betTracks } };

                // act
                // @ts-ignore
                const actual = consumer.composeHedgeBetValidationCriteria(betChoices, player);

                // assert
                expect(actual).toEqual([]);
            });
        });
        describe("when there are hedge bets", () => {
            const testCases = [
                { betChoices: { player: 20, banker: 20 }, betTracks: {} },
                { betChoices: { player: 20 }, betTracks: { banker: 20 } },
                { betChoices: { banker: 20 }, betTracks: { player: 20 } },
            ];
            it.each(testCases)("should return failure", ({ betChoices, betTracks }) => {
                // arrange
                consumer.definition.hedgeBetGroups = [["player", "banker"]];
                consumer.getNoticeObj = jest.fn().mockReturnValueOnce("disallowHedgeBet");
                const player = { profile: { name: "user" } };
                consumer.gameData.ingame = { [player.profile.name]: { betTracks } };
                const expected = [
                    {
                        failure: true,
                        notice: "disallowHedgeBet",
                    },
                ];

                // act
                // @ts-ignore
                const actual = consumer.composeHedgeBetValidationCriteria(betChoices, player);

                // assert
                expect(actual).toEqual(expected);
            });
        });
    });
    describe("consume", () => {
        it("should call validate bet", () => {
            // arrange
            consumer.validateBetRequest = jest.fn().mockReturnValueOnce(false);
            consumer.validateRequestParams = jest.fn().mockReturnValueOnce(true);
            const payload = { betChoices: { player: 10, tie: 20 }, clientSeed: "0" };
            consumer.gameData.drawId = 1;

            // act
            // @ts-ignore
            consumer.consume({}, payload);

            // assert
            expect(consumer.validateBetRequest).toHaveBeenCalledWith({}, payload.betChoices, 30, false, 1);
        });
        it("should call validate bet", () => {
            // arrange
            consumer.validateRequestParams = jest.fn().mockReturnValueOnce(false);
            const payload = { betChoices: { player: 10, tie: 20 }, clientSeed: "0" };
            consumer.gameData.drawId = 1;

            // act
            // @ts-ignore
            consumer.consume({}, payload);

            // assert
            expect(consumer.validateRequestParams).toHaveBeenCalledWith(payload, {});
        });
    });
    describe("anyChoiceExceedItsMaxBet", () => {
        const testCases = [
            { betChoices: { player: 10, banker: 10 }, betTracks: {}, userMaxBet: 30, expected: false },
            { betChoices: { player: 10, banker: 10 }, betTracks: { player: 10, banker: 10 }, userMaxBet: 30, expected: false },
            { betChoices: { player: 10 }, betTracks: { banker: 10 }, userMaxBet: 30, expected: false },
            { betChoices: { player: 10, banker: 10 }, betTracks: { banker: 10 }, userMaxBet: 30, expected: false },
            { betChoices: { player: 10, banker: 10 }, betTracks: { player: 10 }, userMaxBet: 15, expected: true },
            { betChoices: { player: 20 }, betTracks: {}, userMaxBet: 15, expected: true },
            { betChoices: { player: 30 }, betTracks: {}, userMaxBet: 50, expected: true },
        ];

        it.each(testCases)("should return expected", ({ betChoices, betTracks, userMaxBet, expected }) => {
            // arrange
            const configs = { maxBetPerChoices: { player: 20, banker: 20 } };

            // act
            // @ts-ignore
            const actual = consumer.anyChoiceExceedItsMaxBet(betChoices, betTracks, configs, userMaxBet);

            // assert
            expect(actual).toBe(expected);
        });
    });

    describe("anyChoiceExceedItsMaxWin", () => {
        const testCases = [
            { betChoices: { player: 10, banker: 10 }, betTracks: {}, maxBet: 100, expected: false },
            { betChoices: { player: 10, banker: 10 }, betTracks: { player: 10, banker: 10 }, maxBet: 100, expected: false },
            { betChoices: { player: 10 }, betTracks: { banker: 10 }, maxBet: 100, expected: false },
            { betChoices: { player: 10, banker: 10 }, betTracks: { banker: 10 }, maxBet: 39, expected: true },
            { betChoices: { player: 10, banker: 10 }, betTracks: { player: 10 }, maxBet: 60, expected: false },
            { betChoices: { player: 20 }, betTracks: {}, maxBet: 100, expected: false },
            { betChoices: { player: 30 }, betTracks: {}, maxBet: 50, expected: true },
        ];

        it.each(testCases)("should return expected", ({ betChoices, betTracks, maxBet, expected }) => {
            // arrange
            consumer.gameData.odds = { player: 2, banker: 2 };
            const configs = { maxWinPerRound: 1 };

            // act
            // @ts-ignore
            const actual = consumer.anyChoiceExceedItsMaxWin(betChoices, betTracks, configs, maxBet);

            // assert
            expect(actual).toBe(expected);
        });
    });

    describe("anyChoiceBelowMinBet", () => {
        const testCases = [
            { betChoices: { player: 10, tie: 1 }, expected: true },
            { betChoices: { player: 10, tie: 20 }, expected: false },
        ];

        it.each(testCases)("should return expected", ({ betChoices, expected }) => {
            // arrange
            const minBet = 10;

            // act
            const actual = consumer.anyChoiceBelowMinBet(betChoices, minBet);

            // assert
            expect(actual).toBe(expected);
        });
    });

    describe("adjustBetTracks", () => {
        it("should adjust betTracks when betTracks is empty object", () => {
            // arrange
            const playerName = "player";
            const bet = { betChoices: { choice1: 1, choice2: 1 } };
            consumer.gameData.ingame = { [playerName]: { betTracks: {} } };

            // act
            consumer.adjustBetTracks(playerName, bet as any);

            // assert
            expect(consumer.gameData.ingame[playerName].betTracks).toEqual({ choice1: 1, choice2: 1 });
        });
        it("should adjust betTracks when betTracks is not empty object", () => {
            // arrange
            const playerName = "player";
            const bet = { betChoices: { choice1: 1, choice2: 1 } };
            consumer.gameData.ingame = { [playerName]: { betTracks: { choice1: 1 } } };

            // act
            consumer.adjustBetTracks(playerName, bet as any);

            // assert
            expect(consumer.gameData.ingame[playerName].betTracks).toEqual({ choice1: 2, choice2: 1 });
        });
    });
});
