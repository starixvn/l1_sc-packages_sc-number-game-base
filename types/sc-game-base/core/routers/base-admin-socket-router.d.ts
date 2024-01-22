export default class BaseAdminSocketRouter {
    /**
     * @param {Object} dependencies
     * @param {GameDefinition} dependencies.definition
     * @param {GameData} dependencies.gameData
     * @param {AdminAuthenticationConsumer} dependencies.adminAuthenticationConsumer
     * @param {AdminMonitorConsumer} dependencies.adminMonitorConsumer
     * @param {AdminDisconnectConsumer} dependencies.adminDisconnectConsumer
     * @param {logger} dependencies.logService
     * @param {Object} appConfigs
     */
    constructor({ definition, gameData, adminAuthenticationConsumer, adminMonitorConsumer, adminDisconnectConsumer, logService, appConfigs, }: {
        definition: GameDefinition;
        gameData: GameData;
        adminAuthenticationConsumer: AdminAuthenticationConsumer;
        adminMonitorConsumer: AdminMonitorConsumer;
        adminDisconnectConsumer: AdminDisconnectConsumer;
        logService: logger;
    });
    definition: GameDefinition;
    gameData: GameData;
    adminAuthenticationConsumer: AdminAuthenticationConsumer;
    adminMonitorConsumer: AdminMonitorConsumer;
    adminDisconnectConsumer: AdminDisconnectConsumer;
    logService: logger;
    appConfigs: any;
    /**
     * @param {Socket} socketClient
     */
    init(socketClient: Socket): void;
    socketClient: Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, any>;
    handleMessage(payload: any): Promise<void>;
    handleDisconnect(): void;
    verify(): boolean;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { AdminAuthenticationConsumer } from "./../event-consumers";
import { AdminMonitorConsumer } from "./../event-consumers";
import { AdminDisconnectConsumer } from "./../event-consumers";
import { Socket } from "socket.io";
