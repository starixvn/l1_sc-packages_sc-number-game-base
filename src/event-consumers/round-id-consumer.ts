import { BaseEventConsumers } from "sc-game-base/src/core";
import { getOrDefault } from "sc-game-base/src/core/game-management-api";
import GameData from "../game-data";
import GameDefinition from "../game-definition";

export default class RoundIdConsumer extends BaseEventConsumers.RoundIdConsumer {
    declare gameData: GameData;
    declare definition: GameDefinition;

    async initRoundId() {
        const unfinishedRound = await this.getLastRound(false);
        if (unfinishedRound) {
            this.gameData.roundId = unfinishedRound.id;
        } else {
            const lastRound = await this.getLastRound(true);

            if (lastRound) {
                this.gameData.roundId = lastRound.id + 1;
            } else {
                this.gameData.roundId = await this.getLastArchiveRound();
            }
        }

        await this.initDrawId();
    }

    async initDrawId() {
        const unfinishedRound = await this.getLastRound(false);
        if (unfinishedRound) {
            this.gameData.drawId = unfinishedRound.drawId + 1;
            return;
        }
        const lastRound = await this.getLastRound(true);
        if (lastRound) {
            this.gameData.drawId = lastRound.drawId + 1;
        } else {
            this.gameData.drawId = ((await this.getLastArchiveRound()) - 1) * this.definition.numberOfTurnsPerRound + 1;
        }
    }

    async getLastArchiveRound() {
        const { configName } = this.definition;
        const archiveStatus = await getOrDefault(this.gameManagementApiClient.archiveStatus.getArchiveStatus(configName), null);

        return archiveStatus ? (archiveStatus.lastArcId["_phiens"] ?? archiveStatus.lastArcId["_rounds"]) + 1 : 1;
    }

    async getLastRound(isEnded: boolean) {
        return this.roundsRepository
            .findOne({ ended: isEnded }, "id drawId", { sort: { id: -1 } })
            .lean()
            .exec();
    }
}
