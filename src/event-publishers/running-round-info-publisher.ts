import { Core } from "sc-game-base";
import { BetCountHelper } from "../helpers";
import GameData from "../game-data";

export default class RunningRoundInfoPublisher extends Core.BaseEventPublishers.RunningRoundInfoPublisher {
    publish() {
        super.publish();

        this.publishBetPercentageAndPlayerBetCount();
    }

    publishBetPercentageAndPlayerBetCount() {
        const payload = this.getBetPercentageAndPlayerBetCount();
        this.publishToAllUsers(payload);
    }

    getBetPercentageAndPlayerBetCount() {
        const betCount = (this.gameData as GameData).playerBetCount;
        const betPercentage = BetCountHelper.calculateBetPercentage(betCount);
        const playerBetCount = BetCountHelper.calculatePlayerBetCount(betCount);
        return { betPercentage, playerBetCount };
    }
}
