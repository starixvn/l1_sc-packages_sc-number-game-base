import { Core, Table } from "sc-game-base";
import GameDefinition from "../game-definition";
import GameData from "../game-data";
import mongoose from "mongoose";

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
        userInfosRepository,
        tempBetsRepository,
    }: {
        definition: GameDefinition;
        gameData: GameData;
        publisher: Core.BaseEventPublishers.BaseEventPublisher;
        userInfosRepository: mongoose.Model<any>;
        tempBetsRepository: mongoose.Model<any>;
    }) {
        super(definition, gameData, publisher, userInfosRepository, tempBetsRepository);
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
