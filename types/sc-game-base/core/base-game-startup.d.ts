export default class BaseGameStartup {
    /**
     * @param {awilix.AwilixContainer} container
     */
    constructor(container: awilix.AwilixContainer);
    dependencies: {
        definition: string;
        gameData: string;
        gameCron: string;
        processBetQueue: string;
        socketRouter: string;
        adminSocketRouter: string;
        httpRouter: string;
    };
    container: awilix.AwilixContainer<any>;
    definition: any;
    gameData: any;
    gameCron: any;
    processBetQueue: any;
    /**
     * @param {Socket} socketClient
     */
    initSocketRouter(socketClient: Socket): void;
    /**
     * @param {Socket} socketClient
     */
    initAdminSocketRouter(socketClient: Socket): void;
    /**
     * @param {express.Express} app
     */
    initHttpRouter(app: express.Express): void;
    /**
     *
     * @param {express.Express} app
     * @param {Server} socketServer
     */
    start(app: express.Express, socketServer: Server): Promise<void>;
}
import * as awilix from "awilix";
import { Socket } from "socket.io";
import { Server } from "socket.io";
