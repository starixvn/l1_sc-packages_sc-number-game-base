import { stub } from "jest-auto-stub";
import RunningRoundInfoPublisher from "../../../src/event-publishers/running-round-info-publisher";
import { GameData } from "../../../src";
import { Core } from "sc-game-base";
import { BetCountHelper } from "../../../src/helpers";

jest.mock("../../../src/helpers", () => ({
    BetCountHelper: {
        calculateBetPercentage: jest.fn(),
        calculatePlayerBetCount: jest.fn(),
    },
}));
describe("RunningRoundInfoPublisher", () => {
    describe("publish", () => {
        let publisher: RunningRoundInfoPublisher;
        const gameData = stub<GameData>();
        beforeEach(() => {
            publisher = new RunningRoundInfoPublisher("game1", gameData);
            Core.BaseEventPublishers.RunningRoundInfoPublisher.prototype.publish = jest.fn();
            publisher.publishToAllUsers = jest.fn();
        });
        it("should call supper.publish", () => {
            // arrange
            publisher.publishPlayerBetCount = jest.fn();

            // act
            publisher.publish();

            // assert
            expect(Core.BaseEventPublishers.RunningRoundInfoPublisher.prototype.publish).toHaveBeenCalled();
        });

        it("should publish bet percentage & player bet count", () => {
            // arrange
            (publisher.gameData as GameData).playerBetCount = { choice1: ["1", "2", "3"], choice2: ["4"] };
            const betPercentage = { choice1: 75, choice2: 25 };
            (BetCountHelper.calculateBetPercentage as jest.Mock).mockReturnValueOnce(betPercentage);
            const playerBetCount = { choice1: 3, choice2: 1 };
            (BetCountHelper.calculatePlayerBetCount as jest.Mock).mockReturnValueOnce(playerBetCount);

            // act
            publisher.publish();

            // assert
            expect(publisher.publishToAllUsers).toHaveBeenCalledWith({ betPercentage, playerBetCount });
        });
    });
});
