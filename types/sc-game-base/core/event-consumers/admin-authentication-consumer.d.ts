export default class AdminAuthenticationConsumer {
    /**
     * @param {GameData} gameData
     * @param {String} adminSecretKey
     * @param {AdminPublisher} adminPublisher
     */
    constructor(gameData: GameData, adminSecretKey: string, adminPublisher: AdminPublisher);
    gameData: GameData;
    adminSecretKey: string;
    adminPublisher: AdminPublisher;
    /**
     * @param {Socket} socketClient
     * @param {string} token
     */
    consume(socketClient: Socket, token: string): void;
}
import GameData from "./../game-data";
import { AdminPublisher } from "./../event-publishers";
import { Socket } from "socket.io";
