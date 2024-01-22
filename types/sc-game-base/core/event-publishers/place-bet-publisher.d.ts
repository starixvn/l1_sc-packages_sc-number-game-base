export default class PlaceBetPublisher extends BaseEventPublisher {
    publishGameFailedBet(playerId: any, payload: any): void;
    publishGeneralFailedBet(playerId: any, payload: any): void;
    publishSuccessBet(playerId: any, payload: any, rate: any): void;
}
import BaseEventPublisher from "./base-event-publisher";
