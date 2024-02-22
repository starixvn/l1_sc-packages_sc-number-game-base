import { asClass } from "awilix";
import { Table } from "sc-game-base";
import { InGameConsumer, PlaceBetConsumer, ProvablyFairConsumer, RoundIdConsumer, SettleGameRoundConsumer } from "./event-consumers";
import { GameCron, ProcessBetQueue } from "./crons";
import { RoundResultPublisher, RunningRoundInfoPublisher } from "./event-publishers";
import { HistoryQuery, RoundQuery } from "./query-apis";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    registerApis() {
        super.registerApis();
        this.container.register({
            roundQuery: asClass(RoundQuery).singleton(),
            historyQuery: asClass(HistoryQuery).singleton(),
        });
    }

    registerConsumers() {
        super.registerConsumers();
        this.container.register({
            inGameConsumer: asClass(InGameConsumer).singleton(),
            placeBetConsumer: asClass(PlaceBetConsumer).singleton(),
            settleGameRoundConsumer: asClass(SettleGameRoundConsumer).singleton().proxy(),
            roundIdConsumer: asClass(RoundIdConsumer).singleton(),
            provablyFairConsumer: asClass(ProvablyFairConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
            runningRoundInfoPublisher: asClass(RunningRoundInfoPublisher).singleton(),
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
