export default class SettleGameRoundConsumer {
    /**
     * @param {Object} dependencies
     * @param {GameDefinition} dependencies.definition
     * @param {GameData} dependencies.gameData
     * @param {RoundResultPublisher} dependencies.roundResultPublisher
     * @param {UserBetResultPublisher} dependencies.userBetResultPublisher
     * @param {*} dependencies.endGame
     * @param {mongoose.Model} dependencies.roundsRepository
     * @param {mongoose.Model} dependencies.betsRepository
     * @param {GameManagementApiClientFactory} dependencies.gameManagementApiClientFactory
     */
    constructor({ definition, gameData, roundResultPublisher, userBetResultPublisher, endGame, roundsRepository, betsRepository, gameManagementApiClientFactory, }: {
        definition: GameDefinition;
        gameData: GameData;
        roundResultPublisher: RoundResultPublisher;
        userBetResultPublisher: UserBetResultPublisher;
        endGame: any;
        roundsRepository: mongoose.Model;
        betsRepository: mongoose.Model;
        gameManagementApiClientFactory: GameManagementApiClientFactory;
    });
    definition: GameDefinition;
    gameData: GameData;
    roundResultPublisher: RoundResultPublisher;
    userBetResultPublisher: UserBetResultPublisher;
    endGame: any;
    roundsRepository: mongoose.Model;
    betsRepository: mongoose.Model;
    gameManagementApiClient: import("sc-game-management-client").gameManagementClient;
    settleRound(): Promise<void>;
    generateResult(): any;
    queryBets(roundId: any): any;
    settleBets({ settlementResult, roundId, time }: {
        settlementResult: any;
        roundId: any;
        time: any;
    }): Promise<void>;
    calculateBetResult(settlementResult: any, bet: any, odds: any): {
        totalBetAmount: number;
        totalWin: number;
        netWin: number;
        totalLost: number;
        winningByChoices: {};
    };
    captureBetResult(uid: any, betResult: any, rate: any): void;
    collectRoundResult(result: any, settlementResult: any, roundId: any): {
        result: any;
        settlementResult: any;
        roundId: any;
    };
    callEndGame(bet: any, roundId: any, time: any, betResult: any): Promise<void>;
    formatEndGameInfo(bet: any, roundId: any, time: any, betResult: any): {
        gameInfo: {
            gameId: number;
            gameRoundId: any;
            siteId: any;
            time: any;
            operatorId: any;
            playerId: any;
        };
        settlementInfo: {
            redPlay: any;
            freeBet: any;
        };
    };
}
import GameDefinition from "./../game-definition";
import GameData from "./../game-data";
import { RoundResultPublisher } from "./../event-publishers";
import { UserBetResultPublisher } from "./../event-publishers";
import GameManagementApiClientFactory from "../game-management-api";
