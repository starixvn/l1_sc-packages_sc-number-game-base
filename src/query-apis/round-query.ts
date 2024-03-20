import { Core } from "sc-game-base";
import { CryptoHelper } from "sc-game-base/src/core/helpers";

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

    async getPfInfo(drawId: number, roundId: number) {
        const round = await this.getOne(roundId, { _id: false });

        const drawResult = round.result.find((r: any) => r.drawId === drawId);

        const pfResult = await this.getPFResult(drawId);

        return pfResult
            ? {
                  roundId: pfResult.roundId,
                  drawId: pfResult.drawId,
                  serverSeedHash: pfResult.serverSeedHash,
                  ...(drawResult && { roundResult: round.result, ...pfResult }),
              }
            : null;
    }

    async getPFResult(drawId: number) {
        const projection = {
            _id: false,
            __v: false,
            __archive: false,
        };

        const result = await this.resultsRepository.findOne({ drawId }, projection).lean().exec();

        const { encryptedServerSeed } = result;

        const serverSeed = CryptoHelper.decrypt(encryptedServerSeed);

        return { ...result, serverSeed };
    }
}
