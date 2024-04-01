import { Core, Table } from "sc-game-base";
import { helpers } from "sc-common";
import GameDefinition, { BotSettings, Duration } from "../game-definition";
import GameData from "../game-data";
import mongoose from "mongoose";
import GameManagementApiClientFactory from "sc-game-base/src/core/game-management-api";
import { ProvablyFairConsumer } from "../event-consumers";
import { getCurrentTimeOfTurn } from "../helpers";

export default class Bot extends Table.Crons.TableGameBot {
    declare definition: GameDefinition;
    declare gameData: GameData;
    betOptions: string[];
    smallTicketRatio: number;
    smallTickets: number;
    allBets: Record<string, number>;
    hedgeBetGroups: any[];
    botChips: number[];
    botSettings: BotSettings;

    constructor(
        definition: GameDefinition,
        gameData: GameData,
        publisher: Core.BaseEventPublishers.BaseEventPublisher,
        gameManagementApiClientFactory: GameManagementApiClientFactory,
        tempBetsRepository: mongoose.Model<any>,
        provablyFairConsumer: ProvablyFairConsumer
    ) {
        super(definition, gameData, publisher, gameManagementApiClientFactory, tempBetsRepository, provablyFairConsumer);
        this.betOptions = definition.choices;
        this.smallTicketRatio = 70;
        this.smallTickets = 0;
        this.botSettings = definition.botSettings;
        this.hedgeBetGroups = definition.hedgeBetGroups;
        this.allBets = {};
        this.botChips = [
            20_000_000, 5_000_000, 1_000_000, 500_000, 200_000, 100_000, 50_000, 20_000, 10_000, 2000, 1000, 500, 200, 100, 50, 10, 5, 1,
        ];
    }

    async run() {
        if (this.gameData.gameConfigs?.botenabled && this.isDuringBetTime()) {
            const random = this.chance.integer({ min: 0, max: 5 });

            if (this.shouldAddBot(random)) {
                await this.joinRoom();
            }

            if (this.shouldRemoveBot(random)) {
                await this.leaveRoom();
            }

            const botsToBet = this.getBotsToBet();

            botsToBet.length > 0 && (await this.placeBets(botsToBet));
        }
    }

    getNumberOfBotsToJoin() {
        const remainingBots = this.maxNumberOfBots - Object.keys(this.botsInRoom).length;
        const remainingTime = this.getCurrentTimeOfTurn();
        const maxBotRandom =
            remainingBots > 0
                ? Math.min(Math.max(1, this.maxNumberOfBots / remainingTime), remainingBots)
                : Math.max(1, this.maxNumberOfBots / remainingTime);
        return this.chance.integer({ min: 1, max: maxBotRandom });
    }

    async leaveRoom() {
        const remainingTime = this.getCurrentTimeOfTurn();
        const maxBotRemoveRandom = Math.max(Object.values(this.botsInRoom).length / remainingTime, 4);
        const totalRemoval = this.chance.integer({ min: 1, max: Math.max(maxBotRemoveRandom, 1) });
        const removalIds = this.getRemovalBotIds(totalRemoval);

        await this.removeBots(removalIds);
    }

    isDuringBetTime() {
        const { lockingBet } = this.definition.durations;
        const time = this.getCurrentTimeOfTurn();
        return time > lockingBet;
    }

    getBotsToBet() {
        const remainingTime = this.getCurrentTimeOfTurn();
        const maxTickets = Math.floor(Object.keys(this.botsInRoom).length / remainingTime) + 5;
        const numberBotsToBet = this.chance.integer({ min: 5, max: maxTickets });

        let botsToBet = Object.values(this.botsInRoom).filter(
            (t: any) => t.totalBet < this.gameData.gameConfigs.bot_maxbet && t.remainTickets > 0
        );

        botsToBet = this.chance.shuffle(botsToBet);

        return botsToBet.slice(0, Math.min(numberBotsToBet, botsToBet.length - 1));
    }

    updateBalanceAndPublishBetPayload(botId: string, choice: string, amount: number, balance: number): void {
        this.updatePlayerBetCount(botId, choice);
        if (this.gameData.players[botId]) {
            this.gameData.players[botId].red = balance;
        }
    }

    updatePlayerBetCount(playerId: string, choice: string) {
        if (this.definition.choices.includes(choice)) {
            if (!this.gameData.playerBetCount[choice]) {
                this.gameData.playerBetCount[choice] = [];
            }
            !this.gameData.playerBetCount[choice].includes(playerId) && this.gameData.playerBetCount[choice].push(playerId);
        }
    }

    getCurrentTimeOfTurn() {
        const { wholeTurn } = this.definition.durations as Duration;
        return getCurrentTimeOfTurn(this.gameData.remainingTime, wholeTurn, this.definition.numberOfTurnsPerRound);
    }

    resetAllBotData() {
        super.resetAllBotData();
        this.resetAllBets();
    }

    resetAllBets() {
        this.betOptions.forEach((opt: string) => {
            this.allBets[opt] = 0;
        });

        this.smallTickets = 0;
    }

    updateBotInRoomData(bot: any, choice: string, amount: number, balance: number) {
        super.updateBotInRoomData(bot, choice, amount, balance);

        this.allBets[choice] = this.allBets[choice] ? this.allBets[choice] + amount : amount;
        this.smallTickets += amount <= this.getMinBet() * 50 ? 1 : 0;
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

    getBetChoice(bot: any) {
        const betChoiceRatios = this.getBetChoicesRatios();
        const underRatioGroups = helpers.arrayHelper.shuffle(betChoiceRatios.filter((data) => data.underBetRatio));
        const choice = underRatioGroups.length > 0 ? this.chance.pickone(underRatioGroups[0].group) : this.chance.pickone(this.betOptions);
        const hedgeBetGroup = this.hedgeBetGroups.find((group) => group.includes(choice));

        if (hedgeBetGroup) {
            const oppositeChoice = choice === hedgeBetGroup[0] ? hedgeBetGroup[1] : hedgeBetGroup[0];
            return bot.choices.includes(oppositeChoice) ? oppositeChoice : choice;
        } else {
            return choice;
        }
    }

    getBetChoicesRatios() {
        const totalBotBet = this.getAllBetAmountOnChoices(this.betOptions);
        return Object.keys(this.botSettings.ratio).map((group) => {
            const betOptions = this.botSettings[group] as string[];
            return {
                group: betOptions,
                underBetRatio: (this.getAllBetAmountOnChoices(betOptions) * 100) / totalBotBet < this.botSettings.ratio[group],
            };
        });
    }

    getAllBetAmountOnChoices(choices: string[]) {
        return choices.reduce((total, choice) => total + (this.allBets[choice] ?? 0), 0);
    }

    getMaxBet(_: any, choice: string) {
        const gameConfigs = this.gameData.gameConfigs;
        const minBet = this.getMinBet();
        const maxBetPerChoice = gameConfigs.choices_maxbet[choice];
        const botMaxBet = gameConfigs.bot_maxbet;
        const maxBet = Math.min(maxBetPerChoice, botMaxBet);
        const isSmallTicket = this.totalTickets === 0 ? true : (this.smallTickets * 100) / this.totalTickets < this.smallTicketRatio;
        const maxBetOfSmallTicket = Math.min(minBet * 50, botMaxBet * 0.3);
        return isSmallTicket ? maxBetOfSmallTicket : maxBet;
    }

    convertAmountToChip(amount: number) {
        const chipList = this.botChips.filter((chip) => amount / chip >= 1);

        return chipList.length > 0 ? chipList[0] : this.getMinBet();
    }

    async insertOrUpdateBet(bot: any, choice: string, amount: number, currentBet: any) {
        const currentAmount = currentBet ? currentBet[choice] : 0;
        const update = { [choice]: amount + currentAmount };
        const create = {
            uid: bot.id,
            name: bot.name,
            drawId: this.gameData.drawId,
            roundId: this.gameData.roundId,
            odds: this.gameData.odds,
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
