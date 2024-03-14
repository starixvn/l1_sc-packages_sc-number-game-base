import { stub } from "jest-auto-stub";
import Chance from "chance";
import GameData from "../../../src/game-data";
import { RoundResultConsumer, ProvablyFairConsumer } from "../../../src/event-consumers";
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
    const provablyFairConsumer = stub<ProvablyFairConsumer>();
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
        consumer = new RoundResultConsumer(gameData, definition, roundResultPublisher, resultsRepository, provablyFairConsumer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateAndUpdatePfWithFinalSeeds", () => {
        describe("when this.definition.provablyFair = true ", () => {
            beforeEach(() => {
                consumer.definition.provablyFair = true;
                consumer.generateFinalSeeds = jest.fn().mockReturnValue(pf);
            });

            it("should call generateFinalSeeds", async () => {
                // Act
                await consumer.generateAndUpdatePfWithFinalSeeds();

                // Assert
                expect(consumer.generateFinalSeeds).toHaveBeenCalled();
            });

            it("should update resultsRepository", async () => {
                // Act
                await consumer.generateAndUpdatePfWithFinalSeeds();

                // Assert
                expect(resultsRepository.findOneAndUpdate).toHaveBeenCalledWith({ drawId: drawId }, pf);
            });
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
