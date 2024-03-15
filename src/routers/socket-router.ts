import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { RoundQuery } from "../query-apis";

export default class SocketRouter extends BaseSocketRouter {
    declare gameData: GameData;
    declare definition: GameDefinition;

    init(socketClient: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>): void {
        super.init(socketClient);
        this.socketClient.on("getLobbyData", this.getLobbyData.bind(this));
    }

    async getLobbyData() {
        try {
            if (!this.verify() || this.gameData.disabled) {
                return;
            }
            const roundHistory = await (this.roundQuery as RoundQuery).getList(
                this.definition.numberOfRoundHistory,
                {},
                this.definition.numberOfTurnsPerRound
            );
            const result = { players: this.gameData.players, roundHistory, remainingTime: this.gameData.remainingTime };

            this.socketClient.emit(this.definition.name, result);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
