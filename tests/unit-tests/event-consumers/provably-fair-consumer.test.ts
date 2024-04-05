import { stub } from "jest-auto-stub";
import { ProvablyFairConsumer } from "../../../src/event-consumers";
import GameData from "../../../src/game-data";
import { Chance } from "chance";

describe("ProvablyFairConsumer tests", () => {
    const gameData = stub<GameData>();
    const consumer = new ProvablyFairConsumer(gameData, null, null);

    describe("getBetFilter", () => {
        it("should return correctBetFilter", () => {
            // Arrange
            const drawId = new Chance().natural();
            gameData.drawId = drawId;

            // Act
            const actual = consumer.getBetFilter();

            // Assert
            expect(actual).toEqual({ drawId });
        });
    });
});
