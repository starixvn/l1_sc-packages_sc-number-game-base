import { Core } from "sc-game-base";
import RoundQuery from "./round-query";

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
    declare roundQuery: RoundQuery;

    async queryHistory(player: any, page: number, pageSize: number): Promise<any> {
        if (page < 1 || !player) {
            return {};
        }

        const filter = { uid: player.UID, paid: true };
        const numberOfSkippedBets = (page - 1) * pageSize;
        const total = await this.betsRepository.countDocuments(filter).exec();
        const betProjection = {
            _id: false,
            uid: false,
            siteId: false,
            playerId: false,
            __v: false,
            __archive: false,
            currency: false,
            operatorId: false,
            paid: false,
        };

        const bets: any[] = await this.betsRepository
            .find(filter, betProjection, { sort: { time: -1 }, skip: numberOfSkippedBets, limit: pageSize })
            .lean()
            .exec();
        let betLogs: any[] = [];
        if (bets && bets.length > 0) {
            betLogs = await Promise.all(
                bets.map(async (currentDrawBet: any) => {
                    const betLogDetails = await this.getBetLogDetailsEachDraw(player, currentDrawBet.drawId);
                    const round = await this.roundQuery.getOne(currentDrawBet.roundId, { _id: false });
                    const result = round.result.find((e: any) => e.drawId === currentDrawBet.drawId);
                    const settlementResult = round.settlementResult.find((e: any) => e.drawId === currentDrawBet.drawId);
                    const pfResult = await this.roundQuery.getPfInfo(currentDrawBet.drawId, currentDrawBet.roundId);

                    return {
                        ...this.convertBet(currentDrawBet),
                        roundId: currentDrawBet.roundId,
                        drawId: currentDrawBet.drawId,
                        result: result,
                        settlementResult: settlementResult,
                        totalAmount: currentDrawBet.totalAmount,
                        betwin: currentDrawBet.betwin,
                        time: currentDrawBet.time,
                        betLogDetails: betLogDetails,
                        pfResult: pfResult,
                        odds: currentDrawBet.odds,
                    };
                })
            );
        }

        return { history: { betLogs, page, pageSize, total } };
    }

    getBetLogDetailsEachDraw(player: any, drawId: number) {
        return this.betLogsRepository
            .find(
                { uid: player.UID, drawId },
                { _id: false, time: true, choice: true, amount: true, select: true, bet: true },
                { sort: { _id: -1 } }
            )
            .lean()
            .exec();
    }
}
