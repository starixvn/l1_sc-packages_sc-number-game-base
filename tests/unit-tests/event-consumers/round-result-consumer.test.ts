import { stub } from "jest-auto-stub";
import Chance from "chance";
import GameData from "../../../src/game-data";
import { RoundResultConsumer } from "../../../src/event-consumers";
import { GameConfigs, ProvablyFair } from "sc-game-base/src/core/game-data";
import { RoundResultPublisher } from "../../../src/event-publishers";
import { GameDefinition } from "../../../src";
import { Helpers } from "sc-game-base/src/core";
import { CryptoHelper } from "sc-game-base/src/core/helpers";

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
    const roundResultPublisher = stub<RoundResultPublisher>();
    const definition = {
        generateResult: jest.fn(),
    } as GameDefinition;
    const chance = new Chance();
    const drawId = chance.natural();
    const roundId = chance.natural();
    const pf: ProvablyFair = {
        serverSeed: chance.guid(),
        serverSeedHash: chance.guid(),
        clientSeeds: [
            { name: "player1", clientSeed: chance.integer({ min: 0, max: 9999 }).toString() },
            { name: "player2", clientSeed: chance.integer({ min: 0, max: 9999 }).toString() },
            { name: "player3", clientSeed: chance.integer({ min: 0, max: 9999 }).toString() },
            { name: "player4", clientSeed: chance.integer({ min: 0, max: 9999 }).toString() },
            { name: "player5", clientSeed: chance.integer({ min: 0, max: 9999 }).toString() },
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
                consumer.getFinalSeeds = jest.fn().mockReturnValue(pf);
            });

            it("should call getFinalSeeds", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(consumer.getFinalSeeds).toHaveBeenCalledWith(drawId, pf);
            });

            it("should call definition.generateResult", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(definition.generateResult).toHaveBeenCalledWith({ finalHash: pf.finalHash, serverSeed: pf.serverSeed });
            });

            it("should set gameData.result", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(gameData.result).toBe(result);
            });
        });
    });

    describe("getFinalSeeds", () => {
        describe("when this.definition.provablyFair = true ", () => {
            beforeEach(() => {
                consumer.definition.provablyFair = true;
                consumer.generateFinalSeeds = jest.fn().mockReturnValue(pf);
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
                expect(resultsRepository.findOneAndUpdate).toHaveBeenCalledWith({ drawId: drawId }, pf);
            });
        });
    });

    describe("generateFinalSeeds", () => {
        const result = chance.floating();
        const finalSeeds = { clientSeeds: "clientSeeds", mergeClientSeed: "mergedClient", mergeSeed: "merged", finalHash: "aaaa" };

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

    describe("generateServerSeedAndPublishHash", () => {
        const randomMode = chance.natural();
        const serverSeed = chance.guid();
        const sha256Hash = chance.guid();

        beforeEach(() => {
            gameData.gameConfigs = {
                randomMode,
            } as GameConfigs;
            consumer.createResultRecord = jest.fn();
            Helpers.ServerSeedHelper.generateServerSeed = jest.fn().mockReturnValueOnce(serverSeed);
            Helpers.SeedHelper.getSHA256Hash = jest.fn().mockReturnValueOnce(sha256Hash);
        });

        it("should call generateServerSeed", () => {
            // Act
            consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(Helpers.ServerSeedHelper.generateServerSeed).toHaveBeenCalledWith(randomMode);
        });

        it("should call getSHA256Hash", () => {
            // Act
            consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(Helpers.SeedHelper.getSHA256Hash).toHaveBeenCalledWith(serverSeed);
        });

        it("should call createResultRecordPf", async () => {
            // Act
            await consumer.generateServerSeedAndPublishHash();

            // Assert
            expect(consumer.createResultRecord).toHaveBeenCalledWith(serverSeed, sha256Hash);
        });

        it("should call roundResultPublisher.publishServerSeedHash", async () => {
            // Act
            await consumer.generateServerSeedAndPublishHash();

            // Assert
            expect((consumer.roundResultPublisher as RoundResultPublisher).publishServerSeedHash).toHaveBeenCalled();
        });
    });

    describe("createResultRecordPf", () => {
        beforeEach(() => {
            CryptoHelper.encrypt = jest.fn().mockReturnValue("encrypted server seed");
        });

        it("should call CryptoHelper.encrypt", async () => {
            // Arrange
            const { serverSeed, serverSeedHash } = pf;

            const mockDate = new Date();
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);

            // Act
            await consumer.createResultRecord(serverSeed, serverSeedHash);

            // Assert
            expect(CryptoHelper.encrypt).toHaveBeenCalledWith(serverSeed);
        });

        it("should call resultsRepository.create", async () => {
            // Arrange
            const { serverSeed, serverSeedHash } = pf;
            const encryptedServerSeed = CryptoHelper.encrypt(serverSeed);

            const mockDate = new Date();
            jest.spyOn(global, "Date").mockImplementation(() => mockDate);

            // Act
            await consumer.createResultRecord(serverSeed, serverSeedHash);

            // Assert
            expect(resultsRepository.create).toHaveBeenCalledWith({ drawId, roundId, serverSeedHash, encryptedServerSeed, time: mockDate });
        });
    });
});
