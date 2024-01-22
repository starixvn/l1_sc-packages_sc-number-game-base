export default class AdminDisconnectConsumer {
    /**
     * @param {GameData} gameData
     */
    constructor(gameData: GameData);
    gameData: GameData;
    /**
     * @param {Socket} socketClient
     */
    consume(socketClient: Socket): void;
}
import GameData from "./../game-data";
import { Socket } from "socket.io";
