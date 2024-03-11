import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class ProvablyFairConsumer extends BaseEventConsumers.ProvablyFairConsumer {
    declare gameData: GameData;

    async updateClientSeedFromDatabase() {
        this.gameData.pf.clientSeeds = [];
        const allBets = await this.getAllBets(this.gameData.drawId);
        const sortedBets = this.sortByTime(allBets);

        for (const bet of sortedBets) {
            this.addClientSeed({ name: bet.name, clientSeed: bet.clientSeed });
        }
    }

    async getAllBets(drawId: number) {
        const betFilter = { drawId };
        const betProjection = {
            time: true,
            clientSeed: true,
            name: true,
        };
        const options = { sort: { time: 1 } };

        const playerBets = await this.betsRepository.find(betFilter, betProjection, options).lean().exec();

        const botBets = this.tempBetsRepository ? await this.tempBetsRepository.find(betFilter, betProjection, options).lean().exec() : [];

        return playerBets.concat(botBets);
    }
}
