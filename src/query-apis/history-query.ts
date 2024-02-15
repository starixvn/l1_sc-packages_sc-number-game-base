import { Core } from "sc-game-base";

export default class HistoryQuery extends Core.QueryApis.HistoryQuery {
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
        let betLogsGrouped = {};
        if (bets && bets.length > 0) {
            betLogs = await Promise.all(
                bets.map(async (currentDrawBet: any) => {
                    const betDetails = await this.getBetLogDetailsEachDraw(player, currentDrawBet.roundId, currentDrawBet.drawId);
                    return {
                        roundId: currentDrawBet.roundId,
                        drawId: currentDrawBet.drawId,
                        result: {
                            player: currentDrawBet.player,
                            banker: currentDrawBet.banker,
                            tie: currentDrawBet.tie,
                        },
                        totalAmount: currentDrawBet.totalAmount,
                        betwin: currentDrawBet.betwin,
                        time: currentDrawBet.time,
                        betDetails: betDetails,
                    };
                }
            ));
            betLogs.sort((a, b) => b.time - a.time);
            betLogsGrouped = betLogs.reduce((acc, cur) => {
                return {
                    ...acc,
                    [cur.roundId]: [
                        ...(acc[cur.roundId] || []), cur
                    ]
                }
            }, {});
        }

        return { history: { betLogsGrouped, page, pageSize, total } };
    }

    getBetLogDetailsEachDraw(player: any, roundId: any, drawId: any) {
        return this.betLogsRepository
            .find(
                { roundId, uid: player.UID, drawId },
                { _id: false, time: true, choice: true, amount: true, select: true, bet: true },
                { sort: { _id: -1 } }
            )
            .lean()
            .exec();
    }

    async getRoundTime(roundId: any): Promise<any> {
        const round = await this.roundQuery.getOne(roundId);
        return round.time;
    }
}

