export default class InGameConsumer {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {RoundQuery} roundQuery
     * @param {BaseEventPublisher} publisher
     * @param {*} getBalance
     * @param {GameManagementApiClientFactory} gameManagementApiClientFactory
     */
    constructor(definition: GameDefinition, gameData: GameData, roundQuery: RoundQuery, publisher: BaseEventPublisher, getBalance: any, gameManagementApiClientFactory: GameManagementApiClientFactory);
    definition: GameDefinition;
    gameData: GameData;
    roundQuery: RoundQuery;
    publisher: BaseEventPublisher;
    getBalance: any;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    consume(realPlayer: any): Promise<void>;
    buildPayload(realPlayer: any): Promise<{
        roundId: number;
        gameConfigs: any;
        roundHistory: any;
        ownBets: any;
        totalBets: {};
        user: {
            rate: number;
            UID: any;
            name: any;
            avatarId: any;
            red: any;
            scoins: any;
            currency: any;
            type: any;
        } | {
            rate: number;
            UID?: undefined;
            name?: undefined;
            avatarId?: undefined;
            red?: undefined;
            scoins?: undefined;
            currency?: undefined;
            type?: undefined;
        };
        resultHash: {
            rawValue: any;
            extraInfos: any;
            hashValue?: undefined;
        } | {
            hashValue: any;
            rawValue?: undefined;
            extraInfos?: undefined;
        };
    }>;
    getResultHash(): {
        rawValue: any;
        extraInfos: any;
        hashValue?: undefined;
    } | {
        hashValue: any;
        rawValue?: undefined;
        extraInfos?: undefined;
    };
    getUserInfo(realPlayer: any): Promise<{
        UID: any;
        name: any;
        avatarId: any;
        red: any;
        scoins: any;
        currency: any;
        type: any;
    } | {
        UID?: undefined;
        name?: undefined;
        avatarId?: undefined;
        red?: undefined;
        scoins?: undefined;
        currency?: undefined;
        type?: undefined;
    }>;
    formatUserInfo(userInfo: any): {
        UID: any;
        name: any;
        avatarId: any;
        red: any;
        scoins: any;
        currency: any;
        type: any;
    } | {
        UID?: undefined;
        name?: undefined;
        avatarId?: undefined;
        red?: undefined;
        scoins?: undefined;
        currency?: undefined;
        type?: undefined;
    };
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { RoundQuery } from "./../query-apis";
import { BaseEventPublisher } from "./../event-publishers";
import GameManagementApiClientFactory from "../game-management-api";
