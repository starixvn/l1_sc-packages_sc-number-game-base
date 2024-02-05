import { GameDefinition as BaseGameDefinition } from "sc-game-base/src/core";
export default class GameDefinition extends BaseGameDefinition {
    constructor(
        {
            id = 0,
            name = "",
            durations = {
                wholeRound: 33,
                placingBets: 25,
                lockingBet: 3,
                showingResult: 5,
                wholeTurn: 33,
                startingRound: 0,
            },
            choices = [],
            choicesMapper = {},
            hedgeBetGroups = [],
            numberOfTurnsPerRound = 1,
            numberOfRoundHistory = 100,
            historyPageSize = 8,
        }: GameSettings,
        generateResult: Function,
        settle: Function,
        generateRawResultForHash: Function,
        getProbabilities: Function
    ) {
        super(
            { id, name, durations, choices, choicesMapper, hedgeBetGroups, numberOfRoundHistory, historyPageSize },
            generateResult,
            settle,
            generateRawResultForHash
        );
        this.numberOfTurnsPerRound = numberOfTurnsPerRound;
        this.getProbabilities = getProbabilities;
    }
    numberOfTurnsPerRound: number;
    getProbabilities: Function;
}
export type Duration = {
    wholeRound: number;
    placingBets: number;
    lockingBet: number;
    showingResult: number;
    wholeTurn: number;
    startingRound: number;
};

export type GameSettings = {
    id: number;
    name: string;
    durations: Duration;
    choices: any[];
    choicesMapper: any;
    hedgeBetGroups: any[];
    numberOfTurnsPerRound: number;
    numberOfRoundHistory?: number;
    historyPageSize?: number;
};
