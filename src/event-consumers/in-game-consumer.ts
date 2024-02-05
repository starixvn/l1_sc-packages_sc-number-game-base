import { Systems } from "sc-game-base/src/constants";
import { TableInGameConsumer } from "sc-game-base/src/table/event-consumers";
import GameDefinition from "../game-definition";
import RoundQuery from "../query-apis/round-query";
import GameData from "../game-data";

export default class InGameConsumer extends TableInGameConsumer {
    async buildPayload(realPlayer: any) {
        const user = await this.getUserInfo(realPlayer);
        const roundHistory = await this.getRoundsHistory();

        const { totalBets, roundId, exchangeRates, chips, gameConfigs, odds, drawId } = this.gameData as GameData;
        const { session } = realPlayer;
        const rate = exchangeRates.code[session.currencyCode] * session.multiplier;
        const configs = this.getGameConfigs(session.currencyGroupId);
        const { ownBets } = this.gameData.ingame[realPlayer.profile.name] || { ownBets: {} };
        const players = realPlayer.session?.system === Systems.Mobi ? {} : this.buildPlayersPayload(realPlayer);

        const payload = {
            roundId,
            roundData: this.getCurrentRoundData(),
            odds,
            drawId,
            gameConfigs: configs,
            roundHistory,
            ownBets,
            totalBets,
            user: { ...user, rate },
            resultHash: this.getResultHash(),
            players,
            chips,
        };

        const disabled = !gameConfigs?.enabled;

        return disabled && realPlayer.session?.system === Systems.Mini
            ? payload
            : { ...payload, remainingTime: this.gameData.remainingTime };
    }

    getCurrentRoundData() {
        const { drawId } = this.gameData as GameData;
        return { drawId };
    }

    getGameConfigs(currencyGroupId: string) {
        const { gameConfigs } = this.gameData;
        const { odds, originalOdds, enableFreeBet, boostedChoices } = gameConfigs;
        const settings = this.gameData.currencyGroupGames.find((x) => x.groupId.toString() === currencyGroupId);

        return { ...settings, odds, originalOdds, enableFreeBet, boostedChoices };
    }

    async getRoundsHistory() {
        const { numberOfTurnsPerRound } = this.definition as GameDefinition;
        return (this.roundQuery as RoundQuery).getList(this.definition.numberOfRoundHistory, {}, numberOfTurnsPerRound);
    }
}
