import { asClass } from "awilix";
import { Table } from "sc-game-base";
import { PlaceBetConsumer, RoundIdConsumer, SettleGameRoundConsumer } from "./event-consumers";
import { GameCron } from "./crons";
import { RoundResultPublisher } from "./event-publishers";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    registerConsumers() {
        super.registerConsumers();
        this.container.register({
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            roundIdConsumer: asClass(RoundIdConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
        });
    }

    registerCrons() {
        super.registerCrons();
        this.container.register({
            gameCron: asClass(GameCron).singleton().proxy(),
        });
    }
}
