import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { RoundQuery } from "../query-apis";

export default class SocketRouter extends BaseSocketRouter {
    declare gameData: GameData;
    declare definition: GameDefinition;
    declare roundQuery: RoundQuery;

    init(socketClient: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>): void {
        super.init(socketClient);
        this.socketClient.on("getLobbyData", this.getLobbyData.bind(this));
        this.socketClient.on("getPfInfo", this.getPfInfo.bind(this));
    }

    async getLobbyData() {
        try {
            if (!this.verify() || this.gameData.disabled) {
                return;
            }
            const roundHistory = await this.roundQuery.getList(
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

    async getPfInfo(payload: any) {
        try {
            if (!this.definition.provablyFair || !this.verify() || payload.drawId > this.gameData.drawId) {
                return;
            }

            const roundId = Math.ceil(payload.drawId / this.definition.numberOfTurnsPerRound);

            const pfResult = await this.roundQuery.getPfInfo(payload.drawId, roundId);

            const realPlayer = this.gameData.realPlayers[this.socketClient.id];

            const { clientSeedDetail } = this.gameData.ingame[realPlayer.profile.name] || { clientSeedDetail: {} };

            const pfInfo = {
                pfResult,
                clientSeedDetail,
            };

            this.socketClient.emit(this.definition.name, pfInfo);
        } catch (error) {
            this.logService.logError(error);
        }
    }
}
