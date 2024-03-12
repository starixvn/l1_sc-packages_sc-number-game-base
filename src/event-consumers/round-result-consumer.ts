import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { CryptoHelper } from "sc-game-base/src/core/helpers";
import GameDefinition from "../game-definition";

export default class RoundResultConsumer extends BaseEventConsumers.RoundResultConsumer {
    declare gameData: GameData;
    declare definition: GameDefinition;
    generateResultFromAdmin() {
        const { settlementResultFromAdmin: resultFromAdmin } = this.gameData;

        if (resultFromAdmin?.result) {
            this.gameData.result = resultFromAdmin.result;
            this.gameData.settlementResultFromAdmin = {};
            return true;
        }

        return false;
    }

    getResultFilter() {
        return { drawId: this.gameData.drawId };
    }

    getDataForGenerateResult() {
        return { finalHash: this.gameData.pf.finalHash, serverSeed: this.gameData.pf.serverSeed };
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
}
