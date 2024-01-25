import { BaseEventPublishers } from "sc-game-base/src/core";

export default class RoundResultPublisher extends BaseEventPublishers.RoundResultPublisher {
    publishWinners(roundId: number, winningPlayers: any, drawId?: number) {
        const payload = {
            roundId,
            drawId,
            winningPlayers,
        };

        this.publishToAllUsers({
            winners: payload,
        });
    }
}
