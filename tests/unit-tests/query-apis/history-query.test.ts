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
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 1, 1),
                    odds: {
                        player: 1.5,
                        banker: 2
                    }
                },
                {
                    _id: 2,
                    uid: 2,
                    siteId: 1,
                    playerId: 1,
                    roundId: 1,
                    drawId: 2,
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 1, 1),
                    odds: {
                        player: 1.25,
                        banker: 1.75
                    }
                },
                {
                    _id: 3,
                    uid: 3,
                    siteId: 1,
                    playerId: 1,
                    roundId: 2,
                    drawId: 3,
                    totalAmount: 10,
                    betwin: 5,
                    paid: true,
                    time: new Date(2024, 2, 1),
                    odds: {
                        player: 1.5,
                        banker: 1.5
                    }
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
                        { drawId: 1, player: 34, banker: 12 },
                        { drawId: 2, player: 33, banker: 22 },
                    ],
                    settlementResult: [
                        { drawId: 1, player: true, banker: false },
                        { drawId: 2, player: true, banker: false },
                    ],
                    time: new Date(2024, 1, 1),
                },
                {
                    _id: 2,
                    id: 2,
                    result: [{ drawId: 3, player: 39, banker: 22 }],
                    settlementResult: [{ drawId: 3, player: true, banker: false }],
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
                            exec: () => Promise.resolve(betLogs.filter((betLog) => betLog.drawId === drawId)),
                        }),
                    };
                },
            };
            const expected = {
                history: {
                    betLogs: [
                        {
                            drawId: 1,
                            _id: 1,
                            uid: 1,
                            siteId: 1,
                            playerId: 1,
                            paid: true,
                            result: {
                                drawId: 1,
                                player: 34,
                                banker: 12,
                            },
                            settlementResult: { drawId: 1, player: true, banker: false },
                            totalAmount: 10,
                            roundId: 1,
                            betwin: 5,
                            time: new Date(2024, 1, 1),
                            betLogDetails: [
                                {
                                    roundId: 1,
                                    drawId: 1,
                                    choice: "player",
                                },
                            ],
                            odds: {
                                player: 1.5,
                                banker: 2
                            }
                        },
                        {
                            drawId: 2,
                            _id: 2,
                            uid: 2,
                            siteId: 1,
                            playerId: 1,
                            paid: true,
                            result: {
                                drawId: 2,
                                player: 33,
                                banker: 22
                            },
                            settlementResult: { drawId: 2, player: true, banker: false },
                            totalAmount: 10,
                            betwin: 5,
                            roundId: 1,
                            time: new Date(2024, 1, 1),
                            betLogDetails: [
                                {
                                    roundId: 1,
                                    drawId: 2,
                                    choice: "banker",
                                },
                            ],
                            odds: {
                                player: 1.25,
                                banker: 1.75
                            }
                        },
                        {
                            drawId: 3,
                            _id: 3,
                            uid: 3,
                            siteId: 1,
                            playerId: 1,
                            paid: true,
                            result: {
                                drawId: 3,
                                player: 39,
                                banker: 22,
                            },
                            settlementResult: { drawId: 3, player: true, banker: false },
                            totalAmount: 10,
                            betwin: 5,
                            roundId: 2,
                            time: new Date(2024, 2, 1),
                            betLogDetails: [
                                {
                                    roundId: 2,
                                    drawId: 3,
                                    choice: "tie",
                                },
                            ],
                            odds: {
                                player: 1.5,
                                banker: 1.5
                            }
                        }
                    ],
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
