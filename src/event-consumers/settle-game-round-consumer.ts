import { Table } from "sc-game-base";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { getFilterObjectWithAllowedKeys, getBetOdds } from "../helpers";
import { RoundResultPublisher } from "../event-publishers";

export type FinishDraw = {
    result: any;
    settlementResult: any;
    roundId: number;
    drawId: number;
    time: Date;
    ended: boolean;
};

export class SettleGameRoundConsumer extends Table.EventConsumers.TableSettleGameRoundConsumer {
    async settleRound() {
        let roundSettled: any;
        const result = this.generateResult();
        const settlementResult = this.definition.settle(result);
        const { roundId, drawId, exchangeRates } = this.gameData as GameData;

        if (this.isFirstDrawOfRound(drawId)) {
            roundSettled = await this.roundsRepository.create({
                id: roundId,
                drawId: drawId,
                result: [result],
                settlementResult: [settlementResult],
                time: new Date(),
                exchangeRateId: exchangeRates.exId,
                ended: false,
            });
        } else {
            const filter = { id: roundId };
            const update = { $push: { result: result, settlementResult: settlementResult }, $set: { drawId: drawId } };

            if (this.isFirstDrawOfRound(drawId)) {
                update.$set = { ...update.$set, ...{ ended: true } };
            }

            const opts = { new: true };
            roundSettled = await this.roundsRepository.findOneAndUpdate(filter, update, opts);
        }

        if (roundSettled) {
            const finish: FinishDraw = {
                result: roundSettled.result,
                settlementResult: roundSettled.settlementResult,
                roundId: roundSettled.id,
                drawId: roundSettled.drawId,
                time: new Date(),
                ended: roundSettled.ended,
            };
            this.roundResultPublisher.publishRoundResult(finish);

            await this.settleBets(finish);

            this.updateNextDrawData(finish);

            (this.roundResultPublisher as RoundResultPublisher).publishWinners(roundId, this.gameData.winningPlayers, drawId);
        }
    }

    isFirstDrawOfRound(drawId: number): boolean {
        return drawId % (this.definition as GameDefinition).numberOfTurnsPerRound === 1;
    }

    async queryBets(drawId: number) {
        const realPlayerBets = await this.betsRepository.find({ drawId: drawId }).exec();
        const botBets = await this.tempBetsRepository.find({ drawId: drawId }).exec();

        return realPlayerBets.concat(botBets);
    }

    async settleBets(finish: FinishDraw) {
        const bets = await this.queryBets(finish.drawId);

        if (bets?.length) {
            const odds = (this.gameData as GameData).odds;

            await Promise.all(
                bets.map(async (bet: any) => {
                    const settlementDrawData = finish.settlementResult.find((s: any) => s.drawId === bet.drawId);

                    const settlementDrawResult = getFilterObjectWithAllowedKeys(settlementDrawData, this.definition.choices);

                    const betResult = this.calculateBetResult(settlementDrawResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.odds = odds;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, finish.drawId, finish.time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    isLastDrawOfRound(drawId: number): boolean {
        return drawId % (this.definition as GameDefinition).numberOfTurnsPerRound === 0;
    }

    updateNextDrawData(finish: FinishDraw) {
        (this.gameData as GameData).drawId = finish.drawId + 1;

        if (this.isLastDrawOfRound(finish.drawId)) {
            this.gameData.roundId = finish.roundId + 1;
        }

        const probabilities = (this.definition as GameDefinition).getProbabilities(finish.ended ? [] : finish.result);

        (this.gameData as GameData).odds = getBetOdds(probabilities, this.gameData.gameConfigs.odds);
    }
}
