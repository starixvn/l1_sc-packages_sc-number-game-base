import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class ProvablyFairConsumer extends BaseEventConsumers.ProvablyFairConsumer {
    declare gameData: GameData;

    async updateClientSeedFromBets() {
        const firstBets = await this.getFirstBets(this.gameData.drawId);
        const sortedBets = this.sortByTime(firstBets);
        const chosenBets = sortedBets.slice(0, this.MaxCombinedClientSeeds);

        for (const bet of chosenBets) {
            this.addClientSeed({ name: bet.name, clientSeed: bet.clientSeed });
        }
    }

    async getFirstBets(drawId: number) {
        const betFilter = { drawId };
        const betProjection = {
            time: true,
            clientSeed: true,
            name: true,
        };
        const options = { sort: { time: 1 }, limit: this.MaxCombinedClientSeeds };

        const firstPlayerBets = await this.betsRepository.find(betFilter, betProjection, options).lean().exec();

        const firstBotBets = this.tempBetsRepository
            ? await this.tempBetsRepository.find(betFilter, betProjection, options).lean().exec()
            : [];

        return firstPlayerBets.concat(firstBotBets);
    }
}
