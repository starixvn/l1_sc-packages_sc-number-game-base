import { asClass, asValue, AwilixContainer } from "awilix";
import { Table } from "sc-game-base";
import {
    InGameConsumer,
    PlaceBetConsumer,
    ProvablyFairConsumer,
    RoundIdConsumer,
    RoundResultConsumer,
    SettleGameRoundConsumer,
    UnsettledRoundConsumer,
} from "./event-consumers";
import { Bot, GameCron, ProcessBetQueue } from "./crons";
import { GameStatusPublisher, RoundResultPublisher, RunningRoundInfoPublisher } from "./event-publishers";
import { HistoryQuery, RoundQuery } from "./query-apis";
import { PlaceBetPublisher } from "sc-game-base/src/core/event-publishers";
import { HttpRouter, SocketRouter } from "./routers";
import { GameDefinition, GameData } from "sc-game-base/src/core";
import { UserRateLimiter } from "./rate-limiters";

export default class ContainerRegistry extends Table.TableContainerRegistry {
    register(appConfigs: any, definition: GameDefinition, gameData: GameData): AwilixContainer<any> {
        super.register(appConfigs, definition, gameData);

        this.container.register({
            userRateLimiter: asClass(UserRateLimiter).singleton(),
            maxCombinedClientSeeds: asValue(0),
        });

        return this.container;
    }

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
            unsettledRoundConsumer: asClass(UnsettledRoundConsumer).singleton().proxy(),
            roundResultConsumer: asClass(RoundResultConsumer).singleton(),
        });
    }

    registerPublishers() {
        super.registerPublishers();

        this.container.register({
            placeBetPublisher: asClass(PlaceBetPublisher).singleton(),
            roundResultPublisher: asClass(RoundResultPublisher).singleton(),
            runningRoundInfoPublisher: asClass(RunningRoundInfoPublisher).singleton(),
            gameStatusPublisher: asClass(GameStatusPublisher).singleton(),
        });
    }

    registerCrons() {
        super.registerCrons();
        this.container.register({
            bot: asClass(Bot).singleton(),
            gameCron: asClass(GameCron).singleton().proxy(),
            processBetQueue: asClass(ProcessBetQueue).singleton().proxy(),
        });
    }

    registerRouters() {
        super.registerRouters();
        this.container.register({
            httpRouter: asClass(HttpRouter),
            socketRouter: asClass(SocketRouter).proxy(),
        });
    }
}
