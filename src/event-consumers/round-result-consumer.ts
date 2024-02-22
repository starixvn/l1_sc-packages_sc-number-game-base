import { RoundResultPublisher } from "../event-publishers";
import { SeedHelper, ServerSeedHelper } from "../helpers";
import { ProvablyFair } from "sc-game-base/src/core/game-data";
import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class RoundResultConsumer extends BaseEventConsumers.RoundResultConsumer {
    async generateResult() {
        const { drawId, pf, settlementResultFromAdmin: resultFromAdmin } = this.gameData as GameData;

        if (drawId === resultFromAdmin.drawId) {
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

    generateFinalSeeds(pf: ProvablyFair): ProvablyFair {
        const { serverSeed, clientSeeds } = pf;
        const mergeClientSeed = SeedHelper.getMergeClientSeed(clientSeeds);
        const mergeSeed = serverSeed + mergeClientSeed;
        const finalHash = SeedHelper.getSHA512Hash(mergeSeed);

        return { clientSeeds, mergeClientSeed, mergeSeed, finalHash } as ProvablyFair;
    }

    async generateServerSeedAndPublishHash() {
        const { randomMode } = this.gameData.gameConfigs;
        const serverSeed = ServerSeedHelper.generateServerSeed(randomMode);
        const serverSeedHash = SeedHelper.getSHA256Hash(serverSeed);

        this.gameData.pf = { ...this.gameData.pf, serverSeed, serverSeedHash };

        await this.createResultRecordPf(serverSeed, serverSeedHash);

        (this.roundResultPublisher as RoundResultPublisher).publishServerSeedHash();
    }

    async createResultRecordPf(serverSeed: string, serverSeedHash: string) {
        await this.resultsRepository.create({
            roundId: this.gameData.roundId,
            serverSeedHash: serverSeedHash,
            serverSeed: serverSeed,
            time: new Date(),
        });
    }
}
