import { Core, Table } from "sc-game-base";
import { helpers } from "sc-common";
import GameDefinition from "../game-definition";
import GameData from "../game-data";
import mongoose from "mongoose";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { ProvablyFairConsumer } from "../event-consumers";

export default class Bot extends Table.Crons.TableGameBot {
    declare gameData: GameData;
    betOptions: any;
    smallTicketRatio: number;
    smallTickets: number;
    allBets: Record<string, number>;
    betChoiceRatio: Record<string, number>;
    hedgeBetGroups: any[];

    constructor(
        definition: GameDefinition,
        gameData: GameData,
        publisher: Core.BaseEventPublishers.BaseEventPublisher,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        provablyFairConsumer: ProvablyFairConsumer,
        tempBetsRepository: mongoose.Model<any>
    ) {
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

    getMaxBet(bot: any, choice: any) {
        return 5000;
    }

    async calculateBet(bot: any) {
        const choice = this.getBetChoice(bot);
        const maxBet = this.getMaxBet(bot, choice);
        const minBet = this.getMinBet();
        const amount = this.convertAmountToChip(helpers.numberHelper.getRandomNumberStep5(minBet, maxBet, true));

        const currentBet = await this.tempBetsRepository.findOne({ uid: bot.id, drawId: this.gameData.drawId }).lean().exec();
        const totalBetAmount = this.getTotalBetAmount(currentBet);

        if (totalBetAmount + amount <= this.gameData.gameConfigs.bot_maxbet && amount < bot.red) {
            return { id: bot.id, choice, amount, currentBet, bot };
        }

        return null;
    }

    async insertOrUpdateBet(bot: any, choice: any, amount: number, currentBet: any) {
        const currentAmount = currentBet ? currentBet[choice] : 0;
        const update = { [choice]: amount + currentAmount };
        const create = {
            uid: bot.id,
            name: bot.name,
            drawId: this.gameData.drawId,
            roundId: this.gameData.roundId,
            time: new Date(),
            currency: " ",
            operatorId: " ",
            clientSeed: bot.clientSeed,
        };

        await this.tempBetsRepository.updateOne(
            { uid: bot.id, drawId: this.gameData.drawId },
            { $set: update, $setOnInsert: create },
            { upsert: true, setDefaultsOnInsert: true }
        );

        return create.time;
    }

    getRemovalBotIds(totalRemoval: number) {
        const botIds = Object.keys(this.botsInRoom);
        if (!this.removeBotAtTheTable && this.gameData.drawId % this.removeBotAtTheTableRoundFrequency === 0) {
            this.removeBotAtTheTable = true;

            const botsOnTable = botIds?.length > 8 ? botIds.slice(0, 8) : botIds;

            return botsOnTable?.length > 3 ? this.chance.pickset(botsOnTable, this.chance.integer({ min: 1, max: 3 })) : botsOnTable;
        }

        return botIds?.length > totalRemoval ? this.chance.pickset(Object.keys(this.botsInRoom), totalRemoval) : botIds;
    }
}
