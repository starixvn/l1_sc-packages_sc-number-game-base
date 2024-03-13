import { stub } from "jest-auto-stub";
import { RoundIdConsumer } from "../../../src/event-consumers";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";

describe("RoundIdConsumer tests", () => {
    let consumer: RoundIdConsumer;
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const gameManagementApiClientFactory = stub<GameManagementApiClientFactory>();
    beforeEach(() => {
        consumer = new RoundIdConsumer(gameData, definition, null, gameManagementApiClientFactory);
    });
    describe("when there is unfinished round", () => {
        const unfinishedRound = { id: 10, drawId: 38 };
        beforeEach(() => {
            const roundsRepository = {
                findOne: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                        exec: jest.fn().mockReturnValue(unfinishedRound),
                    }),
                }),
            };
            consumer.roundsRepository = roundsRepository;
        });
        it("should call getLastRound with isEnded = false", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(consumer.roundsRepository.findOne).toHaveBeenCalledWith({ ended: false }, "id drawId", { sort: { id: -1 } });
        });

        it("should set roundId = roundId of unfinished round", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.roundId).toBe(unfinishedRound.id);
        });

        it("should set expected drawId = drawId of unfinished round", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.drawId).toBe(unfinishedRound.drawId + 1);
        });
    });

    describe("when there is not unfinished round", () => {
        const round = { id: 10, drawId: 40 };
        beforeEach(() => {
            consumer.getLastRound = jest.fn((isEnded) => {
                return isEnded ? round : null;
            }) as any;
        });

        it("should set roundId = lastRoundId + 1", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.roundId).toBe(round.id + 1);
        });

        it("should set drawId = drawId + 1", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.drawId).toBe(round.drawId + 1);
        });
    });

    describe("when not exist round", () => {
        const archiveStatus = {
            lastArcId: { _rounds: 10 },
        };
        beforeEach(() => {
            const roundsRepository = {
                findOne: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                        exec: jest.fn().mockReturnValue(null),
                    }),
                }),
            };
            consumer.roundsRepository = roundsRepository;
            consumer.gameManagementApiClient = {
                archiveStatus: {
                    getArchiveStatus: jest.fn().mockReturnValue({ isSuccessful: true, data: archiveStatus }),
                },
            };
        });

        it("should set roundId = roundId of archive status + 1", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.roundId).toBe(11);
        });

        it("should set drawId = roundId of archive status -1 * 4 + 1", async () => {
            // arrange
            consumer.definition.numberOfTurnsPerRound = 4;

            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.drawId).toBe(41);
        });
    });

    describe("when not exist round & archive status", () => {
        beforeEach(() => {
            const roundsRepository = {
                findOne: jest.fn().mockReturnValue({
                    lean: jest.fn().mockReturnValue({
                        exec: jest.fn().mockReturnValue(null),
                    }),
                }),
            };
            consumer.roundsRepository = roundsRepository;
            consumer.gameManagementApiClient = {
                archiveStatus: {
                    getArchiveStatus: jest.fn().mockReturnValue({ isSuccessful: true, data: null }),
                },
            };
        });

        it("should set roundId = 1", async () => {
            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.roundId).toBe(1);
        });

        it("should set drawId = 1", async () => {
            // arrange
            consumer.definition.numberOfTurnsPerRound = 4;

            // act
            await consumer.initRoundId();

            // assert
            expect(gameData.drawId).toBe(1);
        });
    });
});
