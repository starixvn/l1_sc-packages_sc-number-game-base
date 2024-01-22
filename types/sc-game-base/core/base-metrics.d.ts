export default class BaseMetrics {
    constructor(appConfigs: any);
    appConfigs: any;
    socketIOMetrics: prometheus.SocketIOMetrics;
    metricsEnabled: boolean;
    /**
     * @param {Server} socketServer
     */
    init(socketServer: Server): void;
    getMetrics(): string;
    initBetProcessedTimeMetrics(): void;
    collectBetProcessedTime(totalTime: any): void;
}
import * as prometheus from "socket.io-prom-metrics";
import { Server } from "socket.io";
