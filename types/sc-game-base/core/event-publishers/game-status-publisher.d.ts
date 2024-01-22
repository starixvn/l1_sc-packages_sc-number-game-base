export default class GameStatusPublisher extends BaseEventPublisher {
    publishDisableGameStatus(): void;
    publishEnablingGameStatus(): void;
    publishStartGame(): void;
    publishBoostedOdds(): void;
    publishStartPlacingBetStatus(): void;
    publishEndPlacingBetStatus(): void;
}
import BaseEventPublisher from "./base-event-publisher";
