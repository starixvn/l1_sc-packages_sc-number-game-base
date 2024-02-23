import Chance from "chance";
import { RoundResultPublisher } from "../../../src/event-publishers";
import GameData from "../../../src/game-data";
import { stub } from "jest-auto-stub";
import { ProvablyFair } from "sc-game-base/src/core/game-data";

describe("roundResultPublisher", () => {
    const chance = new Chance();
    const drawId = chance.natural();
    const roundId = chance.natural();
    const result = chance.natural();
    const roundResult = {
        roundId,
        drawId,
        result,
    };
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

    let publisher: RoundResultPublisher;
    let gameData = stub<GameData>();

    beforeEach(() => {
        gameData.result = result;
        gameData.roundId = roundId;
        gameData.drawId = drawId;
        publisher = new RoundResultPublisher("BacBall", gameData);
        publisher.publishToAllUsers = jest.fn();
        publisher.publishToAllAdmins = jest.fn();
    });

    describe("publishRoundResult", () => {
        describe("when exist gameData.pf", () => {
            beforeEach(() => {
                publisher.gameData.pf = pf;
            });

            it("should publish to all users with result and pf info", () => {
                // Act
                publisher.publishRoundResult(roundResult);

                // Assert
                expect(publisher.publishToAllUsers).toHaveBeenCalledWith({
                    finish: { ...roundResult, pf: { ...pf, ...roundResult } },
                });
            });

            it("should publish to all admins", () => {
                // Act
                publisher.publishRoundResult(roundResult);

                // Assert
                expect(publisher.publishToAllAdmins).toHaveBeenCalledWith({ finish: roundResult });
            });
        });
    });

    describe("publishServerSeedHash", () => {
        describe("when server seed hash exists", () => {
            beforeEach(() => {
                publisher.gameData.pf = pf;
            });

            it("should publish server seed hash value to all users", () => {
                // Act
                publisher.publishServerSeedHash();
                publisher.gameData.pf = { ...pf, serverSeedHash: "" };
                // Assert
                expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ pf: { serverSeedHash: pf.serverSeedHash, roundId, drawId } });
            });
        });

        describe("when server seed hash value does not exist", () => {
            it("should not publish server seed hash value", () => {
                // Arrange

                // Act
                publisher.publishServerSeedHash();

                // Assert
                expect(publisher.publishToAllUsers).not.toHaveBeenCalled();
            });
        });
    });

    describe("publishWinners", () => {
        it("should publish winners to all users", () => {
            // Arrange
            const winningPlayers = {};

            // Act
            publisher.publishWinners(roundId, winningPlayers);

            // Assert
            expect(publisher.publishToAllUsers).toHaveBeenCalledWith({
                winners: {
                    roundId,
                    winningPlayers,
                },
            });
        });
    });
});
