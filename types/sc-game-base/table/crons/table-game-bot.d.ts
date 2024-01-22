export default class TableGameBot extends BaseBot {
    /**
     * @param {TableGameDefinition} definition
     * @param {TableGameData} gameData
     * @param {BaseEventPublisher} publisher
     * @param {mongoose.Model} tempBetsRepository
     */
    constructor(definition: TableGameDefinition, gameData: TableGameData, publisher: BaseEventPublisher, gameManagementApiClientFactory: any, tempBetsRepository: mongoose.Model);
    publisher: BaseEventPublisher;
    tempBetsRepository: mongoose.Model;
    inOutValues: {
        in: number;
        out: number;
    };
    removeBotAtTheTable: boolean;
    removeBotAtTheTableRoundFrequency: number;
    minBotsAtTheTable: number;
    botsInRoom: {};
    removeBots(botIds: any): Promise<void>;
    removeBotsIfRatioChanged(totalRemoved: any): Promise<void>;
    shouldAddBot(random: any): boolean;
    shouldRemoveBot(random: any): boolean;
    getBotsToBet(): any[];
    getTicketsPerRound(): any;
    joinRoom(): Promise<void>;
    getNumberOfBotsToJoin(): any;
    botJoinRoom(bot: any): void;
    addToPlayersAndPublish(bot: any): void;
    resetInRoomTrackings(): Promise<void>;
    leaveRoom(): Promise<void>;
    getRemovalBotIds(totalRemoval: any): any;
    placeBets(botsToBet: any): Promise<void>;
    calculateBet(bot: any): Promise<{
        id: any;
        choice: void;
        amount: any;
        currentBet: any;
        bot: any;
    }>;
    convertAmountToChip(amount: any): any;
    updateBalanceAndPublishBetPayload(botId: any, choice: any, amount: any, balance: any): void;
    updateTotalBetsAndChips(choice: any, amount: any): void;
    updateBotInRoomData(bot: any, choice: any, amount: any, balance: any): void;
    insertOrUpdateBet(bot: any, choice: any, amount: any, currentBet: any): Promise<void>;
    generatePlaceBetPayload(playerId: any, choice: any, amount: any, balance: any): {
        playerChip: {
            playerId: any;
            betChoice: any;
            amount: any;
            red: any;
        };
    };
}
import BaseBot from "./../../core/crons/base-bot";
import { BaseEventPublisher } from "./../../core/event-publishers";
import TableGameDefinition from "./../table-game-definition";
import TableGameData from "./../table-game-data";
