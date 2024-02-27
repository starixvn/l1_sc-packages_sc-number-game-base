import { ProvablyFair } from "sc-game-base/src/core/game-data";
import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { SeedHelper, ServerSeedHelper } from "sc-game-base/src/core/helpers";

export default class RoundResultConsumer extends BaseEventConsumers.RoundResultConsumer {
    declare gameData: GameData;
    async generateResult() {
        const { drawId, pf, settlementResultFromAdmin: resultFromAdmin } = this.gameData;

        if (drawId === resultFromAdmin?.drawId) {
            this.gameData.result = resultFromAdmin.result;
            return;
        }

        const finalSeeds = await this.getFinalSeeds(drawId, pf);

        this.gameData.result = this.definition.generateResult(finalSeeds);
    }

    async getFinalSeeds(drawId: number, pf: ProvablyFair): Promise<ProvablyFair> {
        const finalSeeds = this.generateFinalSeeds(pf);

        await this.resultsRepository.findOneAndUpdate(
            { drawId },
            {
                ...finalSeeds,
            }
        );

        this.gameData.pf = { ...finalSeeds };

        return finalSeeds;
    }

    generateFinalSeeds(pf: ProvablyFair) {
        const { clientSeeds } = pf;

        const mergeClientSeed = clientSeeds
            .reduce((sumClientSeeds, clientSeed) => sumClientSeeds + Number(Object.values(clientSeed)[0]), 0)
            .toString();

        return { ...pf, mergeClientSeed };
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

    async generateServerSeedAndPublishHash() {
        const serverSeed = this.generateSeverSeed();
        const serverSeedHash = SeedHelper.getSHA256Hash(serverSeed);

        this.gameData.pf = { ...this.gameData.pf, serverSeed, serverSeedHash };

        await this.createResultRecord(serverSeed, serverSeedHash);

        this.roundResultPublisher.publishServerSeedHash();
    }

    generateSeverSeed() {
        const { randomMode } = this.gameData.gameConfigs;

        return ServerSeedHelper.generateServerSeed(randomMode);
    }
}
