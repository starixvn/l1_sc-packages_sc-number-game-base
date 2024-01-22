export default class TableInGameConsumer extends InGameConsumer {
    buildPayload(realPlayer: any): Promise<{
        players: any;
        chips: any;
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
    } | {
        remainingTime: any;
        players: any;
        chips: any;
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
    buildPlayersPayload(realPlayer: any): any;
}
import InGameConsumer from "../../../src/core/event-consumers/in-game-consumer";
