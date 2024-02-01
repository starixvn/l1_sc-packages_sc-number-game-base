import { Core } from "sc-game-base";

export default class RoundQuery extends Core.QueryApis.RoundQuery {
    async getList(numberOfRoundHistory: number, projections?: any, numberOfTurnsPerRound = 1) {
        const limit = Math.ceil(numberOfRoundHistory / numberOfTurnsPerRound) + 1;
        const rounds: any[] = await this.roundsRepository
            .find({}, projections, { sort: { _id: -1 }, limit: limit })
            .lean()
            .exec();

        return rounds
            .flatMap((round) => {
                return (round.result as any[])?.map((drawResult) => {
                    const settlementResult = round.settlementResult.find((e: any) => e.drawId === drawResult.drawId);
                    return { roundId: round.id, drawId: drawResult.drawId, result: drawResult, settlementResult };
                });
            })
            .sort((drawA, drawB) => drawB.drawId - drawA.drawId)
            .slice(0, numberOfRoundHistory);
    }
}
