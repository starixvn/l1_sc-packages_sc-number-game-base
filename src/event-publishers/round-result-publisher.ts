import { BaseEventPublishers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class RoundResultPublisher extends BaseEventPublishers.RoundResultPublisher {
    getHashedResult() {
        return {
            ...this.gameData.pf,
            roundId: this.gameData.roundId,
            drawId: (this.gameData as GameData).drawId,
            result: this.gameData.result,
        };
    }

    publishServerSeedHash() {
        const serverSeedHash = this.gameData.pf?.serverSeedHash;

        if (serverSeedHash) {
            const pf = { serverSeedHash, roundId: this.gameData.roundId, drawId: (this.gameData as GameData).drawId };

            this.publishToAllUsers({ pf });
        }
    }

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
