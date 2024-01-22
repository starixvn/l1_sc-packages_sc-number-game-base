export default class TableSettleGameRoundConsumer extends SettleGameRoundConsumer {
    /**
     * @param {Object} dependencies
     * @param {TableGameDefinition} dependencies.definition
     * @param {TableGameData} dependencies.gameData
     * @param {RoundResultPublisher} dependencies.roundResultPublisher
     * @param {UserBetResultPublisher} dependencies.userBetResultPublisher
     * @param {*} dependencies.endGame
     * @param {mongoose.Model} dependencies.roundsRepository
     * @param {mongoose.Model} dependencies.betsRepository
     * @param {mongoose.Model} dependencies.tempBetsRepository
     */
    constructor({ definition, gameData, roundResultPublisher, userBetResultPublisher, endGame, roundsRepository, betsRepository, gameManagementApiClientFactory, tempBetsRepository, }: {
        definition: TableGameDefinition;
        gameData: TableGameData;
        roundResultPublisher: RoundResultPublisher;
        userBetResultPublisher: UserBetResultPublisher;
        endGame: any;
        roundsRepository: mongoose.Model;
        betsRepository: mongoose.Model;
        tempBetsRepository: mongoose.Model;
    });
    defaultWinningStatus: {
        win: boolean;
        bet: number;
        winningByChoices: {};
    };
    tempBetsRepository: mongoose.Model;
    queryBets(roundId: any): Promise<any>;
}
import SettleGameRoundConsumer from "./../../core/event-consumers/settle-game-round-consumer";
import TableGameDefinition from "./../table-game-definition";
import TableGameData from "./../table-game-data";
import { RoundResultPublisher } from "./../../core/event-publishers";
import { UserBetResultPublisher } from "./../../core/event-publishers";
