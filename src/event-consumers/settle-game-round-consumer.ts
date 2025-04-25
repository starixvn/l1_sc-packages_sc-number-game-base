import { Table } from "sc-game-base";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { getFilterObjectWithAllowedKeys } from "../helpers";
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
    declare gameData: GameData;
    declare definition: GameDefinition;
    declare roundResultPublisher: RoundResultPublisher;

    async settleRound() {
        let roundSettled: any;
        const drawResult = this.gameData.result;
        const drawSettlementResult = this.definition.settle(drawResult);
        const { roundId, drawId, exchangeRates } = this.gameData;
        Object.assign(drawResult, { drawId: drawId, time: new Date() });
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
                time: drawResult.time,
                isLastDraw: roundSettled.ended,
            };
            this.roundResultPublisher.publishRoundResult(finishDraw);
            this.updateRoundData(finishDraw, roundSettled.result);
            await this.settleBets(finishDraw);
            this.roundResultPublisher.publishWinners(roundId, this.gameData.winningPlayers, drawId);
        }
    }

    isFirstDrawOfRound(drawId: number): boolean {
        return drawId % this.definition.numberOfTurnsPerRound === 1;
    }

    async queryBets(drawId: number) {
        const realPlayerBets = await this.betsRepository.find({ drawId: drawId }).exec();
        const botBets = await this.tempBetsRepository.find({ drawId: drawId }).exec();

        return realPlayerBets.concat(botBets);
    }

    async settleBets(finishDraw: FinishDraw) {
        const bets = await this.queryBets(finishDraw.drawId);

        if (bets?.length) {
            await Promise.all(
                bets.map(async (bet: any) => {
                    const settlementDrawResult = getFilterObjectWithAllowedKeys(finishDraw.settlementResult, this.definition.choices);

                    const betResult = this.calculateBetResult(settlementDrawResult, bet, bet.odds);

                    bet.betwin = betResult.totalWin;
                    bet.paid = true;

                    await bet.save();
                    const endGameResult = await this.callEndGame(bet, finishDraw.drawId, finishDraw.time, betResult);

                    this.captureBetResult(bet.uid, betResult, bet.rate);
                    if (endGameResult.isOk) {
                        await this.userBetResultPublisher.publish(bet.uid, betResult);
                    }
                })
            );
        }
    }

    async callEndGame(bet: any, roundId: number, time: Date, betResult: any) {
        const { gameInfo, settlementInfo } = this.formatEndGameInfo(bet, roundId, time, betResult);

        const apiResult = await this.endGame(bet.uid, gameInfo, settlementInfo);

        if (!apiResult.isOk) {
            this.userBetResultPublisher.publishApiError(bet.uid, apiResult.response);
        }

        return apiResult;
    }

    isLastDrawOfRound(drawId: number): boolean {
        return drawId % this.definition.numberOfTurnsPerRound === 0;
    }

    updateRoundData(finishDraw: FinishDraw, roundResult: any) {
        this.gameData.drawId = finishDraw.drawId + 1;

        if (this.isLastDrawOfRound(finishDraw.drawId)) {
            this.gameData.roundId = finishDraw.roundId + 1;
        }

        this.gameData.roundResult = roundResult;
    }
}
