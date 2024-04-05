import { stub } from "jest-auto-stub";
import Chance from "chance";
import GameData from "../../../src/game-data";
import { RoundResultConsumer, ProvablyFairConsumer } from "../../../src/event-consumers";
import { ProvablyFair } from "sc-game-base/src/core/game-data";
import { RoundResultPublisher } from "../../../src/event-publishers";
import { GameDefinition } from "../../../src";
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
    let consumer: RoundResultConsumer;
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
    const gameData = stub<GameData>();
    const resultsRepository = { findOneAndUpdate: jest.fn(), create: jest.fn() } as any;

    beforeEach(() => {
        gameData.drawId = drawId;
        gameData.roundId = roundId;
        gameData.pf = pf;

        consumer = new RoundResultConsumer(gameData, definition, roundResultPublisher, resultsRepository, provablyFairConsumer);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("generateResult", () => {
        describe("when result is NOT controlled from admin", () => {
            it("should call definition.generateResult with correct data", async () => {
                // Arrange
                consumer.generateAndUpdatePfWithFinalSeeds = jest.fn();
                const data = { finalHash: pf.finalHash, serverSeed: pf.serverSeed };

                // Act
                await consumer.generateResult();

                // Assert
                expect(definition.generateResult).toHaveBeenCalledWith(data);
            });
        });

        describe("when result is controlled from admin", () => {
            beforeEach(() => {
                gameData.settlementResultFromAdmin = {
                    result: {
                        choice: "good choice",
                    },
                };
            });

            it("should NOT call definition.generateResult", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(definition.generateResult).not.toHaveBeenCalled();
            });

            it("should set gameData result", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(gameData.result).toEqual({ choice: "good choice" });
            });
        });
    });

    describe("generateAndUpdatePfWithFinalSeeds", () => {
        describe("when this.definition.provablyFair = true ", () => {
            beforeEach(() => {
                consumer.definition.provablyFair = true;
                consumer.generateFinalSeeds = jest.fn().mockReturnValue(pf);
                gameData.settlementResultFromAdmin = null;
            });

            it("should call resultsRepository.findOneAndUpdate with correct resultFilter", async () => {
                // Act
                await consumer.generateAndUpdatePfWithFinalSeeds();

                // Assert
                expect(resultsRepository.findOneAndUpdate).toHaveBeenCalledWith({ drawId: drawId }, pf);
            });

            it("should call generateFinalSeeds", async () => {
                // Act
                await consumer.generateAndUpdatePfWithFinalSeeds();

                // Assert
                expect(consumer.generateFinalSeeds).toHaveBeenCalled();
            });
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
