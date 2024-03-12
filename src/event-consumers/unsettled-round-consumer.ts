import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { CryptoHelper } from "sc-game-base/src/core/helpers";

export default class UnsettledRoundConsumer extends BaseEventConsumers.UnsettledRoundConsumer {
    declare gameData: GameData;

    async proceed() {
        if (this.gameData.lastResultRecord) {
            await this.generateResult();

            await this.settleGameRoundConsumer.settleRound();
        }
    }

    async generateResult() {
        const { encryptedServerSeed, serverSeedHash, finalHash } = this.gameData.lastResultRecord;
        const serverSeed = CryptoHelper.decrypt(encryptedServerSeed);

        if (finalHash) {
            this.gameData.result = this.definition.generateResult({ finalHash, serverSeed });
        } else {
            await this.provablyFairConsumer.updateClientSeedsFromBets();
            this.provablyFairConsumer.setServerSeed(serverSeed);
            this.provablyFairConsumer.setServerSeedHash(serverSeedHash);
            await this.roundResultConsumer.generateResult();
        }
    }

    async getUnsettledBets() {
        const playerBets = await this.betsRepository.find({ paid: false, drawId: this.gameData.drawId }).lean().exec();
        const botBets = this.tempBetsRepository
            ? await this.tempBetsRepository.find({ paid: false, drawId: this.gameData.drawId }).lean().exec()
            : [];

        return playerBets.concat(botBets);
    }
}
