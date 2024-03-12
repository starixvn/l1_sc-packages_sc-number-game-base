import { BaseEventConsumers } from "sc-game-base/src/core";
import GameData from "../game-data";

export default class ProvablyFairConsumer extends BaseEventConsumers.ProvablyFairConsumer {
    declare gameData: GameData;

    getBetFilter() {
        return { drawId: this.gameData.drawId };
    }
}
