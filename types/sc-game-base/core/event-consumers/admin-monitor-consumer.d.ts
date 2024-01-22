export default class AdminMonitorConsumer {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {AdminPublisher} adminPublisher
     * @param {mongoose.Model} roundsRepository
     */
    constructor(definition: GameDefinition, gameData: GameData, adminPublisher: AdminPublisher, roundsRepository: mongoose.Model);
    definition: GameDefinition;
    gameData: GameData;
    adminPublisher: AdminPublisher;
    roundsRepository: mongoose.Model;
    /**
     * @param {Socket} socketClient
     */
    consume(socketClient: Socket): Promise<void>;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { AdminPublisher } from "./../event-publishers";
import { Socket } from "socket.io";
