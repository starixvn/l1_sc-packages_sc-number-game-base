export default class TableOutGameConsumer extends UserDisconnectConsumer {
    /**
     * @param {TableGameData} gameData
     * @param {BaseEventPublisher} publisher
     */
    constructor(gameData: TableGameData, publisher: BaseEventPublisher);
    publisher: BaseEventPublisher;
}
import UserDisconnectConsumer from "../../core/event-consumers/user-disconnect-consumer";
import BaseEventPublisher from "../../core/event-publishers/base-event-publisher";
import TableGameData from "../table-game-data";
