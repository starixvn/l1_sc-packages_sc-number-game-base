export default class HttpRouter {
    /**
     * @param {Object} appConfigs
     * @param {GameData} gameData
     * @param {HistoryQuery} historyQuery
     * @param {MetricQuery} metricQuery
     * @param {logger} dependencies.logService
     */
    constructor(appConfigs: any, gameData: GameData, historyQuery: HistoryQuery, metricQuery: MetricQuery, logService: any);
    appConfigs: any;
    gameData: GameData;
    historyQuery: HistoryQuery;
    metricQuery: MetricQuery;
    logService: any;
    init(app: any): void;
    verifySession(req: any, res: any, callback: any): Promise<void>;
    handleHistoryRequest(req: any, res: any, userSession: any): Promise<void>;
    handleOnlineUsers(res: any): void;
    collectOnlineUsers(): {
        totalRealPlayer: number;
        realUsers: any[];
        totalTestPlayer: number;
        testUsers: any[];
    };
    mapRealUsers(players: any): {
        testUsers: any[];
        realUsers: any[];
    };
    handleMetrics(req: any, res: any): void;
}
import GameData from "./../game-data";
import { HistoryQuery } from "../query-apis";
import { MetricQuery } from "../query-apis";
