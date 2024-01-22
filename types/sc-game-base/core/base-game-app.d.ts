export default class BaseGameApp {
    /**
     *
     * @param {string} serviceName
     * @param {*} appConfigs
     * @param {BaseMetrics} baseMetrics
     */
    constructor(serviceName: string, appConfigs: any, baseMetrics?: BaseMetrics);
    serviceName: string;
    appConfigs: any;
    baseMetrics: BaseMetrics;
    run(): Promise<void>;
    app: any;
    socketServer: Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
    /**
     * @param {awilix.AwilixContainer} container
     */
    startGame(container: awilix.AwilixContainer): Promise<void>;
    /**
     *
     * @param {http.Server} httpServer
     */
    initSocketServer(httpServer: http.Server): Server<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
    configureServices(app: any): Promise<void>;
}
import BaseMetrics from "./base-metrics";
import { Server } from "socket.io";
import * as awilix from "awilix";
