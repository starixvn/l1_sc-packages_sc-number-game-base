import { BaseSocketRouter } from "sc-game-base/src/core/routers";
import { Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import GameData from "../game-data";
import GameDefinition from "../game-definition";
import { HistoryQuery, RoundQuery } from "../query-apis";
import { InGameConsumer, PlaceBetConsumer, UserDisconnectConsumer, UserSignInConsumer } from "sc-game-base/src/core/event-consumers";
import { UserSignInPublisher } from "sc-game-base/src/core/event-publishers";
import { logger } from "sc-common";
import { PlayGamePermissionValidator } from "sc-game-base/src/core/validators";
import { UserRateLimiter } from "../rate-limiters";

export default class SocketRouter extends BaseSocketRouter {
    declare gameData: GameData;
    declare definition: GameDefinition;
    declare roundQuery: RoundQuery;
    userRateLimiter: UserRateLimiter;

    constructor({
        definition,
        gameData,
        userSignInConsumer,
        inGameConsumer,
        placeBetConsumer,
        userDisconnectConsumer,
        userSignInPublisher,
        historyQuery,
        logService,
        playGamePermissionValidator,
        roundQuery,
        userRateLimiter,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        userSignInConsumer: UserSignInConsumer;
        inGameConsumer: InGameConsumer;
        placeBetConsumer: PlaceBetConsumer;
        userDisconnectConsumer: UserDisconnectConsumer;
        userSignInPublisher: UserSignInPublisher;
        historyQuery: HistoryQuery;
        logService: typeof logger;
        playGamePermissionValidator: PlayGamePermissionValidator;
        roundQuery: RoundQuery;
        userRateLimiter: UserRateLimiter;
    }) {
        super({
            definition,
            gameData,
            userSignInConsumer,
            inGameConsumer,
            placeBetConsumer,
            userDisconnectConsumer,
            userSignInPublisher,
            historyQuery,
            logService,
            playGamePermissionValidator,
            roundQuery,
        });

        this.userRateLimiter = userRateLimiter;
    }

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

    handlePlaceBet(payload: any) {
        try {
            if (!super.verify(payload)) {
                return;
            }

            this.placeBetConsumer.consume(this.gameData.realPlayers[this.socketClient.id], payload);
        } catch (error) {
            this.logService.logError(error);
        }
    }

    verify(payload?: any) {
        const realPlayer = this.gameData.realPlayers[this.socketClient.id];
        const userVerify = super.verify(payload);
        const validate = userVerify && this.userRateLimiter.verify(realPlayer);

        if (userVerify && !validate) {
            const errorMessage = `Rate limit exceeded; request rejected. Request again after ${
                this.userRateLimiter.interval / 1000
            } seconds`;
            this.socketClient.emit("message", { error: errorMessage });
            this.socketClient.disconnect(true);

            this.logService.setTag({ id: "socket-io-id", value: this.socketClient.id });
            this.logService.setTag({ id: "username", value: realPlayer.profile?.name });
            this.logService.setTag({ id: "userId", value: realPlayer.UID });
            this.logService.logError(errorMessage);
            this.logService.setTag({ id: "socket-io-id", value: "" });
            this.logService.setTag({ id: "username", value: "" });
        }

        return validate;
    }
}
