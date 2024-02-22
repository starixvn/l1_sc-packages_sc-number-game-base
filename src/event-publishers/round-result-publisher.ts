import { BaseEventPublishers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class RoundResultPublisher extends BaseEventPublishers.RoundResultPublisher {
    publishRoundResult(roundResult: any) {
        const payload = { finish: roundResult };

        if (this.gameData.pf) {
            this.publishToAllUsers({
                finish: {
                    ...roundResult,
                    pf: {
                        ...this.gameData.pf,
                        roundId: this.gameData.roundId,
                        drawId: (this.gameData as GameData).drawId,
                        result: this.gameData.result,
                    },
                },
            });
        } else {
            this.publishToAllUsers(payload);
        }

        this.publishToAllAdmins(payload);
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
