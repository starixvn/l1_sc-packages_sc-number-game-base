import { stub } from "jest-auto-stub";
import { UnsettledRoundConsumer, SettleGameRoundConsumer, ProvablyFairConsumer, RoundResultConsumer } from "../../../src/event-consumers";
import GameDefinition from "../../../src/game-definition";
import GameData from "../../../src/game-data";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { Chance } from "chance";

jest.mock("sc-game-base/src/core/helpers", () => ({
    CryptoHelper: { decrypt: jest.fn().mockReturnValue("serverSeed") },
}));

describe("UnsettledRoundConsumer tests", () => {
    let consumer: UnsettledRoundConsumer;
    const definition = stub<GameDefinition>();
    const gameData = stub<GameData>();
    const gameManagementApiClientFactory = new GameManagementApiClientFactory({});
    const provablyFairConsumer = stub<ProvablyFairConsumer>();
    const settleGameRoundConsumer = stub<SettleGameRoundConsumer>();
    const roundResultConsumer = stub<RoundResultConsumer>();
    const betsRepository = { find: (): any => {} };
    const betLogsRepository = { find: (): any => {} };
    const tempBetsRepository = { find: (): any => {} };
    const chance = new Chance();

    beforeEach(() => {
        consumer = new UnsettledRoundConsumer({
            gameData: gameData,
            definition: definition,
            betsRepository: betsRepository,
            tempBetsRepository: tempBetsRepository,
            betLogsRepository: betLogsRepository,
            settleGameRoundConsumer: settleGameRoundConsumer,
            roundResultConsumer: roundResultConsumer,
            provablyFairConsumer: provablyFairConsumer,
            gameManagementApiClientFactory: gameManagementApiClientFactory,
        });
    });

    describe("proceed", () => {
        describe("when gameData has lastResultRecord", () => {
            beforeEach(() => {
                gameData.lastResultRecord = {
                    roundId: chance.natural(),
                    drawId: chance.natural(),
                    serverSeedHash: "serverSeedHash",
                    encryptedServerSeed: {},
                    finalHash: "finalHash",
                };
            });

            it("should call generateResult", () => {
                // Arrange
                consumer.generateResult = jest.fn();

                // Act
                consumer.proceed();

                // Assert
                expect(consumer.generateResult).toHaveBeenCalled();
            });

            it("should call generateResult", () => {
                // Arrange
                consumer.generateResult = jest.fn();

                // Act
                consumer.proceed();

                // Assert
                expect(settleGameRoundConsumer.settleRound).toHaveBeenCalled();
            });
        });
    });

    describe("generateResult", () => {
        describe("lastResultRecord has finalHash", () => {
            beforeEach(() => {
                gameData.lastResultRecord = {
                    roundId: chance.natural(),
                    drawId: chance.natural(),
                    serverSeedHash: "serverSeedHash",
                    encryptedServerSeed: {},
                    finalHash: "finalHash",
                };
            });

            it("should call definition.generateResult", () => {
                // Arrange
                const data = { finalHash: "finalHash", serverSeed: "serverSeed" };

                // Act
                consumer.generateResult();

                // Assert
                expect(definition.generateResult).toHaveBeenCalledWith(data);
            });
        });

        describe("lastResultRecord doesn't have finalHash", () => {
            beforeEach(() => {
                gameData.lastResultRecord = {
                    roundId: chance.natural(),
                    drawId: chance.natural(),
                    serverSeedHash: "serverSeedHash",
                    encryptedServerSeed: {},
                };
            });

            it("should call provablyFairConsumer.updateClientSeedsFromBets", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(provablyFairConsumer.updateClientSeedsFromBets).toHaveBeenCalled();
            });

            it("should call provablyFairConsumer.setServerSeed", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(provablyFairConsumer.setServerSeed).toHaveBeenCalledWith("serverSeed");
            });

            it("should call provablyFairConsumer.setServerSeedHash", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(provablyFairConsumer.setServerSeedHash).toHaveBeenCalledWith("serverSeedHash");
            });

            it("should call roundResultConsumer.generateResult", async () => {
                // Act
                await consumer.generateResult();

                // Assert
                expect(roundResultConsumer.generateResult).toHaveBeenCalled();
            });
        });
    });
});
