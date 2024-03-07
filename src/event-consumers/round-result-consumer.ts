import { ProvablyFair } from "sc-game-base/src/core/game-data";
import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { SeedHelper, ServerSeedHelper, CryptoHelper } from "sc-game-base/src/core/helpers";
import GameDefinition from "../game-definition";

export default class RoundResultConsumer extends BaseEventConsumers.RoundResultConsumer {
    declare gameData: GameData;
    declare definition: GameDefinition;
    async generateResult() {
        const { drawId, pf, settlementResultFromAdmin: resultFromAdmin } = this.gameData;

        if (drawId === resultFromAdmin?.drawId) {
            this.gameData.result = resultFromAdmin.result;
            return;
        }

        const finalSeeds = await this.getFinalSeeds(drawId, pf);

        const { serverSeed, serverSeedHash } = pf;

        this.gameData.pf = { ...finalSeeds, serverSeed, serverSeedHash };

        this.gameData.result = this.definition.generateResult({ finalHash: finalSeeds.finalHash, serverSeed });
    }

    async getFinalSeeds(drawId: number, pf: ProvablyFair): Promise<ProvablyFair> {
        if (!this.definition.provablyFair) {
            return {} as ProvablyFair;
        }

        const finalSeeds = this.generateFinalSeeds(pf);

        await this.resultsRepository.findOneAndUpdate(
            { drawId },
            {
                ...finalSeeds,
            }
        );

        return finalSeeds;
    }

    async createResultRecord(serverSeed: string, serverSeedHash: string) {
        const encryptedServerSeed = CryptoHelper.encrypt(serverSeed);

        await this.resultsRepository.create({
            roundId: this.gameData.roundId,
            drawId: this.gameData.drawId,
            serverSeedHash: serverSeedHash,
            encryptedServerSeed: encryptedServerSeed,
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
