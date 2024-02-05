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
    isLastDraw: boolean;
};

export class SettleGameRoundConsumer extends Table.EventConsumers.TableSettleGameRoundConsumer {
    async settleRound() {
        let roundSettled: any;
        const drawResult = this.generateResult();
        const drawSettlementResult = this.definition.settle(drawResult);
        const { roundId, drawId, exchangeRates } = this.gameData as GameData;
        Object.assign(drawResult, { drawId: drawId });
        Object.assign(drawSettlementResult, { drawId: drawId });

        if (this.isFirstDrawOfRound(drawId)) {
            roundSettled = await this.roundsRepository.create({
                id: roundId,
                drawId: drawId,
                result: [drawResult],
                settlementResult: [drawSettlementResult],
                time: new Date(),
                exchangeRateId: exchangeRates.exId,
                ended: false,
            });
        } else {
            const filter = { id: roundId };
            const update = { $push: { result: drawResult, settlementResult: drawSettlementResult }, $set: { drawId: drawId } };

            if (this.isLastDrawOfRound(drawId)) {
                update.$set = { ...update.$set, ...{ ended: true } };
            }

            const opts = { new: true };
            roundSettled = await this.roundsRepository.findOneAndUpdate(filter, update, opts);
        }

        if (roundSettled) {
            const finishDraw: FinishDraw = {
                result: drawResult,
                settlementResult: drawSettlementResult,
                roundId: roundSettled.id,
                drawId: roundSettled.drawId,
                time: new Date(),
                isLastDraw: roundSettled.ended,
            };
            this.roundResultPublisher.publishRoundResult(finishDraw);

            await this.settleBets(finishDraw);

            this.updateRoundData(finishDraw, roundSettled.result);

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

    async settleBets(finishDraw: FinishDraw) {
        const bets = await this.queryBets(finishDraw.drawId);

        if (bets?.length) {
            const odds = (this.gameData as GameData).odds;

            await Promise.all(
                bets.map(async (bet: any) => {
                    const settlementDrawResult = getFilterObjectWithAllowedKeys(finishDraw.settlementResult, this.definition.choices);

                    const betResult = this.calculateBetResult(settlementDrawResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.odds = odds;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, finishDraw.drawId, finishDraw.time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );
        }
    }

    isLastDrawOfRound(drawId: number): boolean {
        return drawId % (this.definition as GameDefinition).numberOfTurnsPerRound === 0;
    }

    updateRoundData(finishDraw: FinishDraw, roundResult: any) {
        (this.gameData as GameData).drawId = finishDraw.drawId + 1;

        if (this.isLastDrawOfRound(finishDraw.drawId)) {
            this.gameData.roundId = finishDraw.roundId + 1;
        }
        (this.gameData as GameData).roundResult = roundResult;
    }
}
