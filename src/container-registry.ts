import { asClass } from "awilix";
import { Table } from "sc-game-base";
import { InGameConsumer, PlaceBetConsumer, RoundIdConsumer, SettleGameRoundConsumer } from "./event-consumers";
import { GameCron, ProcessBetQueue } from "./crons";
import { RoundResultPublisher } from "./event-publishers";
import { RoundQuery } from "./query-apis";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    registerApis() {
        super.registerApis();
        this.container.register({
            roundQuery: asClass(RoundQuery).singleton(),
        });
    }

    registerConsumers() {
        super.registerConsumers();
        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
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
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }
}
