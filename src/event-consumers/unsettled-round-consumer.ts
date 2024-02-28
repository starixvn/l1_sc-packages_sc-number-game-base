import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import { ProvablyFair } from "sc-game-base/src/core/game-data";

export default class UnsettledRoundConsumer extends BaseEventConsumers.UnsettledRoundConsumer {
    declare gameData: GameData;

    async proceed() {
        if (this.gameData.lastResultRecord) {
            const unsettledBets = await this.getUnsettledBets();
            await this.generateResult(unsettledBets);

            await this.settleGameRoundConsumer.settleRound();
        }
    }

    async generateResult(unsettledBets: any) {
        const { serverSeed, serverSeedHash } = this.gameData.lastResultRecord as ProvablyFair;

        this.provablyFairConsumer.addBets(...unsettledBets);
        await this.provablyFairConsumer.updateClientSeedFromBets();
        this.provablyFairConsumer.setServerSeed(serverSeed);
        this.provablyFairConsumer.setServerSeedHash(serverSeedHash);
        await this.roundResultConsumer.generateResult();
    }

    async getUnsettledBets() {
        const playerBets = await this.betsRepository.find({ paid: false, drawId: this.gameData.drawId }).lean().exec();
        const botBets = this.tempBetsRepository
            ? await this.tempBetsRepository.find({ paid: false, drawId: this.gameData.drawId }).lean().exec()
            : [];

        return playerBets.concat(botBets);
    }
}
