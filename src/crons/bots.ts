import { Core, Table } from "sc-game-base";
import GameDefinition from "../game-definition";
import GameData from "../game-data";
import mongoose from "mongoose";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { ProvablyFairConsumer } from "../event-consumers";

export default class Bot extends Table.Crons.TableGameBot {
    betOptions: any;
    smallTicketRatio: number;
    smallTickets: number;
    allBets: Record<string, number>;
    betChoiceRatio: Record<string, number>;
    hedgeBetGroups: any[];

    constructor({
        definition,
        gameData,
        publisher,
        gameManagementApiClientFactory,
        tempBetsRepository,
        provablyFairConsumer,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        publisher: Core.BaseEventPublishers.BaseEventPublisher;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
        provablyFairConsumer: ProvablyFairConsumer;
        tempBetsRepository: mongoose.Model<any>;
    }) {
        super(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository, provablyFairConsumer);
        this.betOptions = definition.choices;
        this.smallTicketRatio = 70;
        this.smallTickets = 0;
        this.hedgeBetGroups = [];
        this.allBets = {};
        this.betChoiceRatio = {};
    }

    resetAllBotData() {
        super.resetAllBotData();
        this.resetAllBets();
    }

    resetAllBets() {
        this.betOptions.map((opt: any) => (this.allBets[opt] = 0));

        this.smallTickets = 0;
    }

    getBetChoice(bot: any) {
        return this.chance.pickone(this.betOptions);
    }
}
