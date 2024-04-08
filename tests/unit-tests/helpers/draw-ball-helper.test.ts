import { generateRemainingBalls } from "../../../src/helpers";

describe("generateRemainingBalls tests", () => {
    it("should return expected", () => {
        // arrange
        const totalBalls = 10;
        const drawnBalls = [3, 7, 9];
        const expected = [1, 2, 4, 5, 6, 8, 10];

        // act
        const actual = generateRemainingBalls(totalBalls, drawnBalls);

        // assert
        expect(actual).toEqual(expected);
    });
});
