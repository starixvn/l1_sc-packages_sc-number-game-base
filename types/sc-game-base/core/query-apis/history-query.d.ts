export default class HistoryQuery {
    /**
     * @param {RoundQuery} roundQuery
     * @param {mongoose.Model} betsRepository
     * @param {mongoose.Model} betLogsRepository
     */
    constructor(roundQuery: RoundQuery, betsRepository: mongoose.Model, betLogsRepository: mongoose.Model);
    roundQuery: RoundQuery;
    betsRepository: mongoose.Model;
    betLogsRepository: mongoose.Model;
    convertBet(bet: any): any;
    convertBetLogs(betLogDetails: any): any;
    queryHistory(player: any, page: any, pageSize: any): Promise<{
        history?: undefined;
    } | {
        history: {
            betLogs: any;
            page: any;
            pageSize: any;
            total: any;
        };
    }>;
    getBetLogDetails(player: any, roundId: any): any;
}
import RoundQuery from "./round-query";
