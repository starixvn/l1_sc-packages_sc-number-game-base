import { getBetOdds } from "../../../src/helpers";

// Add polyfill for toSorted if not available
if (!Array.prototype.toSorted) {
    Array.prototype.toSorted = function (compareFn?: (a: any, b: any) => number) {
        return [...this].sort(compareFn);
    };
}

describe("CalculateOdds tests", () => {
    const margins = [
        { max: 2, choice1: 0.01, choice2: 0.01 },
        { max: 5, choice1: 0.02, choice2: 0.02 },
        { max: 100, choice1: 0.2, choice2: 0.2 },
    ];
    const testCases = [
        { prob: { choice1: 0.5, choice2: 0.5 }, margins, expected: { choice1: 1.98, choice2: 1.98 } },
        { prob: { choice1: 0.25, choice2: 0.25 }, margins, expected: { choice1: 3.92, choice2: 3.92 } },
        { prob: { choice1: 0.1, choice2: 0.1 }, margins, expected: { choice1: 8, choice2: 8 } },
        { prob: { choice1: 0.1, choice2: 0.0124 }, margins, expected: { choice1: 8, choice2: 64 } },
    ];
    it.each(testCases)("should return expected", ({ prob, margins, expected }) => {
        // act
        const actual = getBetOdds(prob, margins);

        // assert
        expect(actual).toEqual(expected);
    });
});
