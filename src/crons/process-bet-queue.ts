import { helpers } from "sc-common";
import { TableProcessBetQueue } from "sc-game-base/src/table/crons";
import GameData from "../game-data";
import GameDefinition, { Duration } from "../game-definition";

type BetPayload = {
    amount: number;
    betChoices: Record<string, number>;
    freeBet?: boolean;
    drawId: number;
    mode?: string;
};

export default class ProcessBetQueue extends TableProcessBetQueue {
    declare gameData: GameData;
    formatApiBetInfo(payload: BetPayload) {
        return {
            amount: payload.amount,
            gameId: this.definition.id,
            gameRoundId: payload.drawId,
            freeBet: payload.freeBet,
            clientSentTime: new Date(),
            metadata: {
                mode: `${payload.mode}`,
            },
        };
    }

    async composeValidationCriteria(player: any, payload: BetPayload) {
        const betAmountValidationCriteria = (await this.composeBalanceValidationCriteria(player, payload)) || [];
        const bettingTimeValidationCriteria = this.composeBettingTimeValidationCriteria(payload.drawId) ?? [];

        return bettingTimeValidationCriteria.concat(betAmountValidationCriteria);
    }

    composeBettingTimeValidationCriteria(drawId: number) {
        const numberOfTurnsPerRound = (this.definition as GameDefinition).numberOfTurnsPerRound;
        const turn = drawId % numberOfTurnsPerRound || numberOfTurnsPerRound;
        const { placingBets, wholeTurn, lockingBet } = this.definition.durations as Duration;
        const remainingTime = this.gameData.remainingTime - wholeTurn * (numberOfTurnsPerRound - turn);

        return [
            {
                failure: drawId !== this.gameData.drawId,
                notice: { errorCode: helpers.noticeHelper.placeBetNextRound },
            },
            {
                failure: remainingTime < lockingBet || remainingTime >= placingBets,
                notice: { errorCode: helpers.noticeHelper.placeBetNextRound },
            },
        ];
    }

    async insertBetLog(player: any, drawId: number, bet: BetPayload, rate: number) {
        await Promise.all(
            Object.entries(bet.betChoices).map(async ([betChoice, amount]) => {
                const newBetLog: any = {
                    uid: player.UID,
                    name: player.profile.name,
                    time: new Date(),
                    choice: betChoice,
                    amount: amount,
                    freeBet: bet.freeBet,
                    roundId: this.gameData.roundId,
                    drawId,
                };

                if (player.session) {
                    newBetLog.siteId = player.session.siteId;
                    newBetLog.currency = player.session.currencyName;
                    newBetLog.rate = rate;

                    newBetLog.operatorId = player.session.operatorId;
                    newBetLog.playerId = player.session.playerId;
                }

                return this.betLogsRepository.create(newBetLog);
            })
        );
    }

    async upsertBet(player: any, drawId: number, bet: BetPayload, rate: number) {
        const { odds, roundId } = this.gameData;
        const newBet: any = {
            uid: player.UID,
            name: player.profile.name,
            time: new Date(),
            odds: odds,
            freeBet: bet.freeBet,
            drawId,
            roundId: roundId,
        };
        const existingBetFilter = { uid: player.UID, roundId, drawId, freeBet: bet.freeBet };
        const existingBetIncrement = {
            ...bet.betChoices,
            totalAmount: bet.amount,
        };

        if (player.session) {
            newBet.siteId = player.session.siteId;
            newBet.currency = player.session.currencyName;
            newBet.rate = rate;

            newBet.operatorId = player.session.operatorId;
            newBet.playerId = player.session.playerId;
        }

        await this.betsRepository.updateOne(
            existingBetFilter,
            { $inc: existingBetIncrement, $setOnInsert: newBet },
            { upsert: true, setDefaultsOnInsert: true }
        );
    }

    adjustTotalBets(player: any, bet: BetPayload, rate: number): void {
        const { betChoices } = bet;

        Object.keys(betChoices).forEach((choice) => {
            this.gameData.totalBets[choice] = (this.gameData.totalBets[choice] ?? 0) + betChoices[choice] * rate;
        });

        this.adjustPlayerBetCount(player, bet);
    }

    adjustPlayerBetCount(player: any, bet: BetPayload) {
        Object.keys(bet.betChoices).forEach((betChoice) => {
            if (this.definition.choices.includes(betChoice)) {
                if (!this.gameData.playerBetCount[betChoice]) {
                    this.gameData.playerBetCount[betChoice] = [];
                }
                !this.gameData.playerBetCount[betChoice].includes(player.UID) && this.gameData.playerBetCount[betChoice].push(player.UID);
            }
        });
    }

    adjustOwnBets(playerName: string, bet: BetPayload): void {
        const { betChoices } = bet;

        if (this.gameData.ingame?.[playerName]) {
            const playerInGame = this.gameData.ingame[playerName];

            if (!playerInGame.ownBets) {
                playerInGame.ownBets = {};
            }
            Object.keys(betChoices).forEach((choice) => {
                playerInGame.ownBets[choice] = (playerInGame.ownBets[choice] ?? 0) + betChoices[choice];
            });
        }
    }

    generatePlacingBetResult(player: any, balance: any, bet: BetPayload, rate: number) {
        const { betChoices, amount } = bet;
        const ownBet: any = super.generatePlacingBetResult(player, balance, bet, rate);

        ownBet.ownChip = { betChoices, amount };

        return ownBet;
    }

    updateGameDataChips(bet: BetPayload, rate: number) {
        const { betChoices } = bet;

        Object.keys(betChoices).forEach((betChoice) => {
            super.updateGameDataChips({ betChoice, amount: betChoices[betChoice] }, rate);
        });
    }

    decreaseBetTracks(playerName: string, bet: BetPayload): void {
        const { betChoices } = bet;
        Object.keys(betChoices).forEach((betChoice) => {
            super.decreaseBetTracks(playerName, { betChoice, amount: betChoices[betChoice] });
        });
    }
}
