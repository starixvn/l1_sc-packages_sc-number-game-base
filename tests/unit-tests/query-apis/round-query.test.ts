import { RoundQuery } from "../../../src/query-apis";

describe("RoundQuery tests", () => {
    describe("getList", () => {
        it("should return expected", async () => {
            // arrange
            const rounds = [
                {
                    _id: 1,
                    id: 1,
                    result: [
                        { drawId: 1, choice1: 1, choice2: 2 },
                        { drawId: 2, choice1: 2, choice2: 3 },
                        { drawId: 3, choice1: 3, choice2: 4 },
                        { drawId: 4, choice1: 4, choice2: 5 },
                    ],
                    settlementResult: [
                        { drawId: 1, choice1: false, choice2: true },
                        { drawId: 2, choice1: false, choice2: true },
                        { drawId: 3, choice1: false, choice2: true },
                        { drawId: 4, choice1: false, choice2: true },
                    ],
                },
                {
                    _id: 2,
                    id: 2,
                    result: [
                        { drawId: 5, choice1: 2, choice2: 1 },
                        { drawId: 6, choice1: 3, choice2: 2 },
                        { drawId: 7, choice1: 4, choice2: 3 },
                        { drawId: 8, choice1: 5, choice2: 4 },
                    ],
                    settlementResult: [
                        { drawId: 5, choice1: true, choice2: false },
                        { drawId: 6, choice1: true, choice2: false },
                        { drawId: 7, choice1: true, choice2: false },
                        { drawId: 8, choice1: true, choice2: false },
                    ],
                },
                {
                    _id: 3,
                    id: 3,
                    result: [
                        { drawId: 9, choice1: 1, choice2: 2 },
                        { drawId: 10, choice1: 2, choice2: 3 },
                        { drawId: 11, choice1: 4, choice2: 1 },
                        { drawId: 12, choice1: 5, choice2: 4 },
                    ],
                    settlementResult: [
                        { drawId: 9, choice1: false, choice2: true },
                        { drawId: 10, choice1: false, choice2: true },
                        { drawId: 11, choice1: true, choice2: false },
                        { drawId: 12, choice1: true, choice2: false },
                    ],
                },
                {
                    _id: 4,
                    id: 4,
                    result: [
                        { drawId: 13, choice1: 3, choice2: 4 },
                        { drawId: 14, choice1: 7, choice2: 5 },
                    ],
                    settlementResult: [
                        { drawId: 13, choice1: false, choice2: true },
                        { drawId: 14, choice1: true, choice2: false },
                    ],
                },
            ];
            const execute = jest.fn().mockReturnValue(rounds);
            const roundsRepository = { find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execute }) }) };
            const roundQuery = new RoundQuery(roundsRepository);
            const numberOfRoundHistory = 10;
            const numberOfTurnsPerRound = 4;
            const expected = [
                {
                    roundId: 4,
                    drawId: 14,
                    result: { drawId: 14, choice1: 7, choice2: 5 },
                    settlementResult: { drawId: 14, choice1: true, choice2: false },
                },
                {
                    roundId: 4,
                    drawId: 13,
                    result: { drawId: 13, choice1: 3, choice2: 4 },
                    settlementResult: { drawId: 13, choice1: false, choice2: true },
                },
                {
                    roundId: 3,
                    drawId: 12,
                    result: { drawId: 12, choice1: 5, choice2: 4 },
                    settlementResult: { drawId: 12, choice1: true, choice2: false },
                },
                {
                    roundId: 3,
                    drawId: 11,
                    result: { drawId: 11, choice1: 4, choice2: 1 },
                    settlementResult: { drawId: 11, choice1: true, choice2: false },
                },
                {
                    roundId: 3,
                    drawId: 10,
                    result: { drawId: 10, choice1: 2, choice2: 3 },
                    settlementResult: { drawId: 10, choice1: false, choice2: true },
                },
                {
                    roundId: 3,
                    drawId: 9,
                    result: { drawId: 9, choice1: 1, choice2: 2 },
                    settlementResult: { drawId: 9, choice1: false, choice2: true },
                },
                {
                    roundId: 2,
                    drawId: 8,
                    result: { drawId: 8, choice1: 5, choice2: 4 },
                    settlementResult: { drawId: 8, choice1: true, choice2: false },
                },
                {
                    roundId: 2,
                    drawId: 7,
                    result: { drawId: 7, choice1: 4, choice2: 3 },
                    settlementResult: { drawId: 7, choice1: true, choice2: false },
                },
                {
                    roundId: 2,
                    drawId: 6,
                    result: { drawId: 6, choice1: 3, choice2: 2 },
                    settlementResult: { drawId: 6, choice1: true, choice2: false },
                },
                {
                    roundId: 2,
                    drawId: 5,
                    result: { drawId: 5, choice1: 2, choice2: 1 },
                    settlementResult: { drawId: 5, choice1: true, choice2: false },
                },
            ];

            // act
            const actual = await roundQuery.getList(numberOfRoundHistory, {}, numberOfTurnsPerRound);

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
