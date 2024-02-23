import { stub } from "jest-auto-stub";
import Chance from "chance";
import GameData from "../../../src/game-data";
import { RoundResultConsumer } from "../../../src/event-consumers";
import { GameConfigs, ProvablyFair } from "sc-game-base/src/core/game-data";
import { SeedHelper, ServerSeedHelper } from "../../../src/helpers";
import { RoundResultPublisher } from "../../../src/event-publishers";

jest.mock("../../../src/helpers", () => {
    return {
        SeedHelper: {
            getMergeClientSeed: jest.fn(),
            getSHA256Hash: jest.fn(),
            getSHA512Hash: jest.fn(),
        },
        ServerSeedHelper: {
            generateServerSeed: jest.fn(),
        },
    };
});

describe("roundResultConsumer", () => {
    const roundResultPublisher = stub(RoundResultPublisher);
    const definition = {
        generateResult: jest.fn(),
    };
    const chance = new Chance();
    const drawId = chance.natural();
    const roundId = chance.natural();
    const pf: ProvablyFair = {
        serverSeed: chance.guid(),
        serverSeedHash: chance.guid(),
        clientSeeds: [
            { player1: chance.integer({ min: 0, max: 9999 }).toString() },
            { player2: chance.integer({ min: 0, max: 9999 }).toString() },
            { player3: chance.integer({ min: 0, max: 9999 }).toString() },
            { player4: chance.integer({ min: 0, max: 9999 }).toString() },
            { player5: chance.integer({ min: 0, max: 9999 }).toString() },
        ],
        finalHash: chance.guid(),
        mergeClientSeed: "",
        mergeSeed: "",
    };
    let consumer: RoundResultConsumer;
    let gameData = stub<GameData>();
    let resultsRepository = { findOneAndUpdate: jest.fn(), create: jest.fn() } as any;

    beforeEach(() => {
        gameData.drawId = drawId;
        gameData.roundId = roundId;
        gameData.pf = pf;
        consumer = new RoundResultConsumer(gameData, definition, roundResultPublisher, resultsRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateResult", () => {
        beforeEach(() => {
            consumer.generateFinalSeeds = jest.fn().mockReturnValueOnce(pf);
        });

        describe("when control this round result from admin", () => {
            it("should set gameData.result", () => {
                // Arrange
                const expectResult = chance.floating();
                consumer.gameData.settlementResultFromAdmin = { drawId: drawId, result: expectResult };

                // Act
                consumer.generateResult();

                // Assert
                expect(consumer.gameData.result).toBe(expectResult);
            });
        });

        describe("when result is NOT controlled", () => {
            const result = chance.floating();

            beforeEach(() => {
                consumer.gameData.settlementResultFromAdmin = null;
                consumer.definition.generateResult.mockReturnValue(result);
            });

            it("should call generateFinalSeeds", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(consumer.generateFinalSeeds).toHaveBeenCalledWith(pf);
            });

            it("should update resultsRepository", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(resultsRepository.findOneAndUpdate).toHaveBeenCalledWith({ drawId: drawId }, pf);
            });

            it("should call definition.generateResult", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(definition.generateResult).toHaveBeenCalledWith(pf.finalHash);
            });

            it("should set gameData.result", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(gameData.result).toBe(result);
            });
        });
    });

    describe("generateFinalSeeds", () => {
        const result = chance.floating();
        const finalSeeds = { clientSeeds: "clientSeeds", mergeClientSeed: "megedClient", mergeSeed: "merged", finalHash: "aaaa" };

        beforeEach(() => {
            definition.generateResult.mockReturnValueOnce(result);
            consumer.generateFinalSeeds = jest.fn().mockReturnValueOnce(finalSeeds);
        });

        it("should call generateFinalSeeds", async () => {
            // Act
            await consumer.getFinalSeeds(drawId, pf);

            // Assert
            expect(consumer.generateFinalSeeds).toHaveBeenCalledWith(pf);
        });

        it("should update resultsRepository", async () => {
            // Act
            await consumer.getFinalSeeds(drawId, pf);

            // Assert
            expect(resultsRepository.findOneAndUpdate).toHaveBeenCalledWith({ drawId: drawId }, finalSeeds);
        });

        it("should update mergeSeed in game data", async () => {
            // Act
            await consumer.getFinalSeeds(drawId, pf);

            // Assert
            expect(gameData.pf.mergeSeed).toBe(finalSeeds.mergeSeed);
        });
    });

    describe("generateFinalSeeds", () => {
        const mergeClientSeed = chance.string();
        const sha512Hash = chance.guid();
        const mergeSeed = pf.serverSeed + mergeClientSeed;

        beforeEach(() => {
            SeedHelper.getMergeClientSeed = jest.fn().mockReturnValueOnce(mergeClientSeed);
            SeedHelper.getSHA512Hash = jest.fn().mockReturnValueOnce(sha512Hash);
        });

        it("should call getMergeClientSeed", () => {
            // Act
            consumer.generateFinalSeeds(pf);

            // Assert
            expect(SeedHelper.getMergeClientSeed).toHaveBeenCalledWith(pf.clientSeeds);
        });

        it("should call getMergeClientSeed", () => {
            // Act
            consumer.generateFinalSeeds(pf);

            // Assert
            expect(SeedHelper.getSHA512Hash).toHaveBeenCalledWith(mergeSeed);
        });

        it("should return pf data", () => {
            // Act
            const result = consumer.generateFinalSeeds(pf);

            // Assert
            expect(result).toStrictEqual({ clientSeeds: pf.clientSeeds, mergeClientSeed, mergeSeed, finalHash: sha512Hash });
        });
    });

    describe("generateServerSeedAndPublishHash", () => {
        const randomMode = chance.natural();
        const serverSeed = chance.guid();
        const sha256Hash = chance.guid();

        beforeEach(() => {
            gameData.gameConfigs = {
                randomMode,
            } as GameConfigs;
            consumer.createResultRecordPf = jest.fn();
            ServerSeedHelper.generateServerSeed = jest.fn().mockReturnValueOnce(serverSeed);
            SeedHelper.getSHA256Hash = jest.fn().mockReturnValueOnce(sha256Hash);
        });

        it("should call generateServerSeed", () => {
            // Act
            consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(ServerSeedHelper.generateServerSeed).toHaveBeenCalledWith(randomMode);
        });

        it("should call getSHA256Hash", () => {
            // Act
            consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(SeedHelper.getSHA256Hash).toHaveBeenCalledWith(serverSeed);
        });

        it("should call createResultRecordPf", async () => {
            // Act
            await consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(consumer.createResultRecordPf).toHaveBeenCalledWith(serverSeed, sha256Hash);
        });

        it("should call roundResultPublisher.publishServerSeedHash", async () => {
            // Act
            await consumer.generateServerSeedAndPublishHash();

            // Assert
            expect((consumer.roundResultPublisher as RoundResultPublisher).publishServerSeedHash).toHaveBeenCalled();
        });
    });

    describe("createResultRecordPf", () => {
        it("should call resultsRepository.create", async () => {
            // Arrange
            const { serverSeed, serverSeedHash } = pf;
            const mockDate = new Date();
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);

            // Act
            await consumer.createResultRecordPf(serverSeed, serverSeedHash);

            // Assert
            expect(resultsRepository.create).toHaveBeenCalledWith({ drawId, roundId, serverSeedHash, serverSeed, time: mockDate });
        });
    });
});
