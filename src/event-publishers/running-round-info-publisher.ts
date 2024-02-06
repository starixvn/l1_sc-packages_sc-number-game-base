import { Core } from "sc-game-base";
import { BetCountHelper } from "../helpers";
import GameData from "../game-data";

export default class RunningRoundInfoPublisher extends Core.BaseEventPublishers.RunningRoundInfoPublisher {
    publish() {
        super.publish();

        this.publishPlayerBetCount();
    }

    publishPlayerBetCount() {
        const betCount = (this.gameData as GameData).playerBetCount;
        const betPercentage = BetCountHelper.calculateBetPercentage(betCount);
        const playerBetCount = BetCountHelper.calculatePlayerBetCount(betCount);
        this.publishToAllUsers({ betPercentage, playerBetCount });
    }
}
