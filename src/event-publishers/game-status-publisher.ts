import { BaseEventPublishers } from "sc-game-base/src/core";

export default class GameStatusPublisher extends BaseEventPublishers.GameStatusPublisher {
    getOddsRange(margin?: Record<string, number>[]): any {
        return margin;
    }

    publishEnablingGameStatus() {
        const { gameConfigs, remainingTime, roundId } = this.gameData;
        const configs = {
            odds: gameConfigs.odds,
            originalOdds: gameConfigs.originalOdds,
            enableFreeBet: gameConfigs.enableFreeBet,
        };

        const oddsRange = this.getOddsRange(gameConfigs.margin);

        const maxWinPerRound = gameConfigs.maxWinPerRound;

        const realPlayers = Object.values(this.gameData.realPlayers);
        realPlayers.forEach((realPlayer: any) => {
            const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === realPlayer.session.currencyGroupId);
            const payload = { gameConfigs: { ...configs, ...settings, oddsRange, maxWinPerRound }, remainingTime, snr: true };
            realPlayer.socketClient && realPlayer.socketClient.emit(this.gameName, payload);
        });

        this.publishToAllAdmins({
            remainingTime,
            roundId,
            currencies: this.gameData.currencies,
            exchangeRates: this.gameData.exchangeRates,
        });
    }
}
