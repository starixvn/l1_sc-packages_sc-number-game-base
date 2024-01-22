export default class UserSignInConsumer {
    /**
     * @param {GameData} gameData
     * @param {UserSignInPublisher} userSignInPublisher
     * @param {PlayGamePermissionValidator} playGamePermissionValidator
     * @param {Object} appConfigs
     * @param {GameManagementApiClientFactory} gameManagementApiClientFactory
     */
    constructor(gameData: GameData, userSignInPublisher: UserSignInPublisher, playGamePermissionValidator: PlayGamePermissionValidator, appConfigs: any, gameManagementApiClientFactory: GameManagementApiClientFactory);
    gameData: GameData;
    userSignInPublisher: UserSignInPublisher;
    playGamePermissionValidator: PlayGamePermissionValidator;
    appConfigs: any;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    /**
     * @param {Socket} socketClient
     */
    consume(socketClient: Socket, payload: any): Promise<void>;
    getUserBetLimit(userSession: any, userInfo: any, socketClient: any): Promise<void>;
    handleSignInSuccess(socketClient: any, userInfo: any, userSession: any): void;
    handleUnauthorizedSignIn(socketClient: any): void;
}
import GameData from "./../game-data";
import UserSignInPublisher from "./../event-publishers/user-signin-publisher";
import { PlayGamePermissionValidator } from "../validators";
import { Socket } from "socket.io";
import GameManagementApiClientFactory from "../game-management-api";
