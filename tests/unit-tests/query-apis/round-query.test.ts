import { Chance } from "chance";
import { RoundQuery } from "../../../src/query-apis";

jest.mock("sc-game-base/src/core/helpers", () => ({
    CryptoHelper: { decrypt: jest.fn().mockReturnValue("serverSeed") },
}));

describe("RoundQuery tests", () => {
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
    const resultRepository = { findOne: jest.fn() };
    const roundQuery = new RoundQuery(roundsRepository, resultRepository);
    const numberOfRoundHistory = 10;
    const numberOfTurnsPerRound = 4;
    const chance = new Chance();

    describe("getList", () => {
        it("should return expected", async () => {
            // arrange
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

    describe("getPFResult", () => {
        describe("when result is null", () => {
            it("should return null", async () => {
                // arrange
                const drawId = 1;

                resultRepository.findOne = jest
                    .fn()
                    .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(null) }) });

                // act
                const actual = await roundQuery.getPFResult(drawId);

                // assert
                expect(actual).toBeNull();
            });
        });

        describe("when result is not null", () => {
            it("should return correct", async () => {
                // arrange
                const drawId = chance.natural();

                const result = {
                    roundId: chance.natural(),
                    drawId: chance.natural(),
                    serverSeedHash: "serverSeedHash",
                    encryptedServerSeed: {},
                    finalHash: "finalHash",
                };

                resultRepository.findOne = jest
                    .fn()
                    .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(result) }) });

                const serverSeed = "serverSeed";

                // act
                const actual = await roundQuery.getPFResult(drawId);

                // assert
                expect(actual).toEqual({
                    ...result,
                    serverSeed,
                });
            });
        });
    });

    describe("getPfInfo", () => {
        const drawId = chance.natural();
        const roundId = chance.natural();

        describe("when not having drawResult yet", () => {
            beforeEach(() => {
                roundQuery.getOne = jest.fn().mockReturnValue(null);
            });
            describe("when pfResult is null", () => {
                it("should return null", async () => {
                    // arrange
                    resultRepository.findOne = jest
                        .fn()
                        .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(null) }) });

                    // act
                    const actual = await roundQuery.getPfInfo(drawId, roundId);

                    // assert
                    expect(actual).toBeNull();
                });
            });

            describe("when pfResult is not null", () => {
                it("should return correct", async () => {
                    // arrange
                    const drawId = chance.natural();

                    const pfResult = {
                        roundId: chance.natural(),
                        drawId: chance.natural(),
                        serverSeedHash: "serverSeedHash",
                        encryptedServerSeed: {},
                        finalHash: "finalHash",
                    };

                    resultRepository.findOne = jest
                        .fn()
                        .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(pfResult) }) });

                    const serverSeed = "serverSeed";

                    const newPfResult = { ...pfResult, serverSeed };

                    const expectedInfo = {
                        roundId: newPfResult.roundId,
                        drawId: newPfResult.drawId,
                        serverSeedHash: newPfResult.serverSeedHash,
                    };

                    // act
                    const actual = await roundQuery.getPfInfo(drawId, roundId);

                    // assert
                    expect(actual).toEqual(expectedInfo);
                });
            });
        });

        describe("when already having drawResult", () => {
            const roundResult = [
                { drawId: 1, choice1: 1, choice2: 2 },
                { drawId: 2, choice1: 2, choice2: 3 },
                { drawId: 3, choice1: 3, choice2: 4 },
                { drawId: 4, choice1: 4, choice2: 5 },
            ];

            beforeEach(() => {
                roundQuery.getOne = jest.fn().mockReturnValue({
                    result: roundResult,
                });
            });
            describe("when pfResult is null", () => {
                it("should return null", async () => {
                    // arrange
                    resultRepository.findOne = jest
                        .fn()
                        .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(null) }) });

                    // act
                    const actual = await roundQuery.getPfInfo(drawId, roundId);

                    // assert
                    expect(actual).toBeNull();
                });
            });

            describe("when pfResult is not null", () => {
                it("should return correct", async () => {
                    // arrange
                    const pfResult = {
                        roundId: chance.natural(),
                        drawId: chance.natural(),
                        serverSeedHash: "serverSeedHash",
                        encryptedServerSeed: {},
                        finalHash: "finalHash",
                        clientSeeds: ["1", "2", "3", "4"],
                    };

                    resultRepository.findOne = jest
                        .fn()
                        .mockReturnValue({ lean: jest.fn().mockReturnValue({ exec: jest.fn().mockReturnValue(pfResult) }) });

                    const serverSeed = "serverSeed";

                    const newPfResult = { ...pfResult, serverSeed };

                    const expectedInfo = {
                        roundId: newPfResult.roundId,
                        drawId: newPfResult.drawId,
                        serverSeedHash: newPfResult.serverSeedHash,
                        serverSeed: newPfResult.serverSeed,
                        encryptedServerSeed: {},
                        finalHash: "finalHash",
                        roundResult: roundResult,
                        clientSeeds: ["1", "2", "3", "4"],
                    };

                    // act
                    const actual = await roundQuery.getPfInfo(1, roundId);

                    // assert
                    expect(actual).toEqual(expectedInfo);
                });
            });
        });
    });
});
