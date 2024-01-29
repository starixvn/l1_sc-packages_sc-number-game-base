import { BaseEventConsumers } from "sc-game-base/src/core";
import { getOrDefault } from "sc-game-base/src/core/game-management-api";
import GameData from "../game-data";

export default class RoundIdConsumer extends BaseEventConsumers.RoundIdConsumer {
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
            (this.gameData as GameData).drawId = unfinishedRound.drawId + 1;
            return;
        }
        const lastRound = await this.getLastRound(true);
        if (lastRound) {
            (this.gameData as GameData).drawId = lastRound.drawId + 1;
        } else {
            const archiveStatus = await this.getLastArchive();
            (this.gameData as GameData).drawId = archiveStatus ? archiveStatus.lastArcId["_draws"] + 1 : 1;
        }
    }

    async getLastArchive() {
        const { configName } = this.definition;
        const archiveStatus = await getOrDefault(this.gameManagementApiClient.archiveStatus.getArchiveStatus(configName), null);
        return archiveStatus;
    }

    async getLastArchiveRound() {
        const archiveStatus = await this.getLastArchive();

        return archiveStatus ? (archiveStatus.lastArcId["_phiens"] ?? archiveStatus.lastArcId["_rounds"]) + 1 : 1;
    }

    async getLastRound(isEnded: boolean) {
        return this.roundsRepository
            .findOne({ ended: isEnded }, "id drawId", { sort: { id: -1 } })
            .lean()
            .exec();
    }
}
