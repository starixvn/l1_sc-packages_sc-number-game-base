import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";
import GameDefinition from "../game-definition";

export class SettleGameRoundConsumer extends BaseEventConsumers.SettleGameRoundConsumer {
    async settleRound() {
        let roundSettled: any;
        const result = this.generateResult();
        const settlementResult = this.definition.settle(result);
        const { roundId, drawId, exchangeRates } = this.gameData as GameData;

        if (drawId % (this.definition as GameDefinition).numberOfTurnsPerRound === 1) {
            roundSettled = await this.roundsRepository.create({
                id: roundId,
                latestDrawId: drawId,
                result: [result],
                settlementResult: [settlementResult],
                time: new Date(),
                exchangeRateId: exchangeRates.exId,
                ended: false,
            });
        } else {
            const filter = { id: roundId };
            let update = { $push: { result: result, settlementResult: settlementResult }, $set: { latestDrawId: drawId } };

            if (drawId % (this.definition as GameDefinition).numberOfTurnsPerRound === 0) {
                update = { ...update, ...{ ended: true } };
            }

            const opts = { new: true };
            roundSettled = await this.roundsRepository.findOneAndUpdate(filter, update, opts);
        }

        if (roundSettled) {
            const finish = {
                result: roundSettled.result,
                settlementResult: roundSettled.settlementResult,
                roundId: roundSettled.id,
                drawId: roundSettled.latestDrawId,
                winningPlayers: this.gameData.winningPlayers,
                time: new Date(),
            };

            this.roundResultPublisher.publishRoundResult(finish);
            (this.gameData as GameData).drawId = finish.drawId + 1;

            if (drawId % 4 === 0) {
                this.gameData.roundId = finish.roundId + 1;
            }

            await this.settleBets(finish);
            this.roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers);
        }
    }

    queryBets(drawId: number) {
        return this.betsRepository.find({ drawId: drawId }).exec();
    }

    async settleBets({ result, settlementResult, drawId, time }: any) {
        const bets = await this.queryBets(drawId);

        if (bets?.length) {
            const odds = this.gameData.gameConfigs.odds;

            await Promise.all(
                bets.map(async (bet: any) => {
                    const settlementDrawResult = settlementResult.find((s: any) => s.drawId === bet.drawId);

                    const betResult = this.calculateBetResult(settlementDrawResult, bet, odds);

                    bet.betwin = betResult.totalWin;
                    bet.odds = odds;
                    bet.paid = true;

                    await bet.save();
                    await this.callEndGame(bet, drawId, time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    await this.userBetResultPublisher.publish(bet.uid, betResult);
                })
            );

            this.gameData.gameConfigs.odds = (this.definition as GameDefinition).getOdds(result);
        }
    }
}
