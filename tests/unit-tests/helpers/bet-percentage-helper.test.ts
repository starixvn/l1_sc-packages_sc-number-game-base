import { BetCountHelper } from "../../../src/helpers";

describe("BetCountHelper tests", () => {
    const playerBetCount = { choice1: ["1", "2", "3"], choice2: ["4"] };

    describe("calculateBetPercentage", () => {
        it("should return expected", () => {
            // arrange
            const expected = { choice1: 75, choice2: 25 };

            // act
            const actual = BetCountHelper.calculateBetPercentage(playerBetCount);

            // assert
            expect(actual).toEqual(expected);
        });
    });

    describe("calculatePlayerBetCount", () => {
        it("should return expected", () => {
            // arrange
            const expected = { choice1: 3, choice2: 1 };

            // act
            const actual = BetCountHelper.calculatePlayerBetCount(playerBetCount);

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
