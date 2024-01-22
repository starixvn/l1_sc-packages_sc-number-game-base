export default class RoundResultPublisher extends BaseEventPublisher {
    publishRoundResult(roundResult: any): void;
    publishResultHash(): void;
    publishWinners(roundId: any, winningPlayers: any): void;
}
import BaseEventPublisher from "./base-event-publisher";
