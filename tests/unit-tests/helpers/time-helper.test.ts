import { getCurrentTimeOfTurn, getCurrentTurn } from "../../../src/helpers";

describe("time hepler tests", () => {
    const wholeTurn = 35;
    const numberOfTurnsPerRound = 3;
    describe("getCurrentTimeOfTurn", () => {
        const testCases = [
            { remainingTime: 107, expected: 37 },
            { remainingTime: 106, expected: 36 },
            { remainingTime: 105, expected: 35 },
            { remainingTime: 104, expected: 34 },
            { remainingTime: 96, expected: 26 },
            { remainingTime: 90, expected: 20 },
            { remainingTime: 71, expected: 1 },
            { remainingTime: 70, expected: 0 },
            { remainingTime: 69, expected: 34 },
            { remainingTime: 35, expected: 0 },
            { remainingTime: 25, expected: 25 },
            { remainingTime: 0, expected: 0 },
        ];
        it.each(testCases)("should return current time", ({ remainingTime, expected }) => {
            // act
            const actual = getCurrentTimeOfTurn(remainingTime, wholeTurn, numberOfTurnsPerRound);

            // assert
            expect(actual).toBe(expected);
        });
    });
    describe("getCurrentTurn", () => {
        const testCases = [
            { remainingTime: 107, expected: 1 },
            { remainingTime: 106, expected: 1 },
            { remainingTime: 105, expected: 1 },
            { remainingTime: 104, expected: 1 },
            { remainingTime: 90, expected: 1 },
            { remainingTime: 96, expected: 1 },
            { remainingTime: 96, expected: 1 },
            { remainingTime: 71, expected: 1 },
            { remainingTime: 70, expected: 1 },
            { remainingTime: 69, expected: 2 },
            { remainingTime: 35, expected: 2 },
            { remainingTime: 30, expected: 3 },
            { remainingTime: 25, expected: 3 },
            { remainingTime: 0, expected: 3 },
        ];
        it.each(testCases)("should return current turn", ({ remainingTime, expected }) => {
            // act
            const actual = getCurrentTurn(remainingTime, wholeTurn, numberOfTurnsPerRound);

            // assert
            expect(actual).toBe(expected);
        });
    });
});
