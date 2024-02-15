import { HistoryQuery } from "../../../src/query-apis";

describe("RoundQuery tests", () => {
    describe("queryHistory", () => {
        it("should return expected", async () => {
            // arrange
            const bets = [
                {
                    _id: 1,
                    uid: 1,
                    siteId: 1,
                    playerId: 1,
                    roundId: 1,
                    drawId: 1,
                    player: 34,
                    banker: 12,
                    tie: 0,
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 1, 1),
                },
                {
                    _id: 2,
                    uid: 2,
                    siteId: 1,
                    playerId: 1,
                    roundId: 1,
                    drawId: 2,
                    player: 33,
                    banker: 22,
                    tie: 0,
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 1, 1),
                },
                {
                    _id: 3,
                    uid: 3,
                    siteId: 1,
                    playerId: 1,
                    roundId: 2,
                    drawId: 3,
                    player: 39,
                    banker: 22,
                    tie: 0,
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 2, 1),
                }
            ];
            const betLogs = [
                {
                    roundId: 1,
                    drawId: 1,
                    choice: "player",
                },
                {
                    roundId: 1,
                    drawId: 2,
                    choice: "banker",
                },
                {
                    roundId: 2,
                    drawId: 3,
                    choice: "tie",
                },
            ];
            const rounds = [
                {
                    _id: 1,
                    id: 1,
                    result: [
                        { drawId: 1, choice1: 1, choice2: 2 },
                        { drawId: 2, choice1: 2, choice2: 3 },
                    ],
                    settlementResult: [
                        { drawId: 1, choice1: false, choice2: true },
                        { drawId: 2, choice1: false, choice2: true },
                    ],
                    time: new Date(2024, 1, 1),
                },
                {
                    _id: 2,
                    id: 2,
                    result: [{ drawId: 5, choice1: 2, choice2: 1 }],
                    settlementResult: [{ drawId: 5, choice1: true, choice2: false }],
                    time: new Date(2024, 2, 1),
                },
            ];
            const execute = jest.fn().mockReturnValue(bets);
            const betRepository = {
                find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: execute }) }),
                countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(bets.length) }),
            };
            const roundQuery = {
                getOne: async (roundId: number) => rounds.find((round) => round.id === roundId),
                convertSettlementResult: (roundResult: any) => {},
                convertResult: (round: any) => {},
                getList: (limit: number, projections?: any) => new Promise(() => {}),
                roundsRepository: {},
            };
            const betLogsRepository = {
                find: ({ roundId, drawId }: { roundId: number; drawId: number }, _: any, __: any) => {
                    return {
                        lean: jest.fn().mockReturnValue({
                            exec: () => Promise.resolve(betLogs.filter((betLog) => betLog.roundId === roundId && betLog.drawId === drawId)),
                        }),
                    };
                },
            };
            const expected = {
                history: {
                    betLogsGrouped: {
                        1: [
                            {
                                drawId: 1,
                                result: {
                                    player: 34,
                                    banker: 12,
                                    tie: 0,
                                },
                                totalAmount: 10,
                                roundId: 1,
                                betwin: 5,
                                time: new Date(2024, 1, 1),
                                betDetails: [
                                    {
                                        roundId: 1,
                                        drawId: 1,
                                        choice: "player",
                                    },
                                ],
                            },
                            {
                                drawId: 2,
                                result: {
                                    player: 33,
                                    banker: 22,
                                    tie: 0,
                                },
                                totalAmount: 10,
                                betwin: 5,
                                roundId: 1,
                                time: new Date(2024, 1, 1),
                                betDetails: [
                                    {
                                        roundId: 1,
                                        drawId: 2,
                                        choice: "banker",
                                    },
                                ],
                            },
                        ],
                        2: [
                            {
                                drawId: 3,
                                result: {
                                    player: 39,
                                    banker: 22,
                                    tie: 0,
                                },
                                totalAmount: 10,
                                betwin: 5,
                                roundId: 2,
                                time: new Date(2024, 2, 1),
                                betDetails: [
                                    {
                                        roundId: 2,
                                        drawId: 3,
                                        choice: "tie",
                                    },
                                ],
                            },
                        ],
                    },
                    page: 1,
                    pageSize: 3,
                    total: 3,
                },
            };

            const historyQuery = new HistoryQuery(roundQuery, betRepository, betLogsRepository);

            // act
            const actual = await historyQuery.queryHistory("player", 1, 3);

            // assert
            expect(actual).toEqual(expected);
        });
    });
});
