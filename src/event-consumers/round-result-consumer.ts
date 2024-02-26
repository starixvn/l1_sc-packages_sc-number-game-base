import { ProvablyFair } from "sc-game-base/src/core/game-data";
import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class RoundResultConsumer extends BaseEventConsumers.RoundResultConsumer {
    declare gameData: GameData;
    async generateResult() {
        const { drawId, pf, settlementResultFromAdmin: resultFromAdmin } = this.gameData;

        if (drawId === resultFromAdmin?.drawId) {
            this.gameData.result = resultFromAdmin.result;
            return;
        }

        const finalSeeds = await this.getFinalSeeds(drawId, pf);

        this.gameData.result = this.definition.generateResult(finalSeeds.finalHash);
    }

    async getFinalSeeds(drawId: number, pf: ProvablyFair): Promise<ProvablyFair> {
        if (!this.resultsRepository) return {} as ProvablyFair;

        const { serverSeed, serverSeedHash } = pf;
        let finalSeeds = this.generateFinalSeeds(pf);

        await this.resultsRepository.findOneAndUpdate(
            { drawId },
            {
                ...finalSeeds,
            }
        );

        this.gameData.pf = { ...finalSeeds, serverSeed, serverSeedHash };

        return finalSeeds;
    }

    async createResultRecord(serverSeed: string, serverSeedHash: string) {
        await this.resultsRepository.create({
            roundId: this.gameData.roundId,
            drawId: this.gameData.drawId,
            serverSeedHash: serverSeedHash,
            serverSeed: serverSeed,
            time: new Date(),
        });
    }
}
