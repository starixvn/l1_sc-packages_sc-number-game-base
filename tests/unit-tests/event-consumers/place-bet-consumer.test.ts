import { Core } from "sc-game-base";
import { PlaceBetConsumer } from "../../../src/event-consumers";
import { stub } from "jest-auto-stub";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";

describe("PlaceBetConsumer test", () => {
    describe("anyChoiceBelowMinBet tests", () => {
        const testCase = [
            { betChoices: { player: 10, tie: 1 }, expected: true },
            { betChoices: { player: 10, tie: 20 }, expected: false },
        ];

        const minBet = 10;
        let consumer: PlaceBetConsumer;
        beforeEach(() => {
            const definition = stub<GameDefinition>();
            const gameData = stub<GameData>();
            const publisher = stub<Core.BaseEventPublishers.BaseEventPublisher>();
            consumer = new PlaceBetConsumer(definition, gameData, publisher);
        });
        it.each(testCase)("should return expected", ({ betChoices, expected }) => {
            // act
            const actual = consumer.anyChoiceBelowMinBet(betChoices, minBet);

            // assert
            expect(actual).toBe(expected);
        });
    });
});
