export default class PlaceBetConsumer {
    /**
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     * @param {BaseEventPublisher} publisher
     */
    constructor(definition: GameDefinition, gameData: GameData, publisher: BaseEventPublisher);
    DisplayMode: {
        Landscape: string;
        Portrait: string;
    };
    definition: GameDefinition;
    gameData: GameData;
    publisher: BaseEventPublisher;
    composeValidationCriteria(player: any, betChoice: any, amount: any, freeBet: any, roundId: any): {
        failure: boolean;
        notice: any;
    }[];
    composeBettingTimeValidationCriteria(roundId: any): {
        failure: boolean;
        notice: any;
    }[];
    composeBetAmountValidationCriteria(player: any, betChoice: any, amount: any, freeBet: any): {
        failure: boolean;
        notice: any;
    }[];
    getNoticeObj(errorCode: any, extraData: any): any;
    composeBetChoiceValidationCriteria(betChoice: any): {
        failure: boolean;
        notice: any;
    }[];
    composeHedgeBetValidationCriteria(betChoice: any, player: any): {
        failure: boolean;
        notice: any;
    }[];
    validateBetRequest(player: any, betChoice: any, amount: any, freeBet: any, roundId: any): boolean;
    consume(player: any, payload: any): void;
    adjustBetTracks(playerName: any, bet: any): void;
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { BaseEventPublisher } from "./../event-publishers";
