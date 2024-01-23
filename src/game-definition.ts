import { GameDefinition as BaseGameDefinition } from "sc-game-base/src/core";
export default class GameDefinition extends BaseGameDefinition {
    constructor(
        {
            id = 0,
            name = "",
            durations = {},
            choices = [],
            choicesMapper = {},
            hedgeBetGroups = [],
            numberOfTurnsPerRound = 1,
            numberOfRoundHistory = 100,
            historyPageSize = 8,
        },
        generateResult: Function,
        settle: Function,
        generateRawResultForHash: Function,
        getOdds: Function
    ) {
        super(
            { id, name, durations, choices, choicesMapper, hedgeBetGroups, numberOfRoundHistory, historyPageSize },
            generateResult,
            settle,
            generateRawResultForHash
        );
        this.numberOfTurnsPerRound = numberOfTurnsPerRound;
        this.getOdds = getOdds;
    }
    numberOfTurnsPerRound: number;
    getOdds: Function;
}
export type Duration = {
    wholeRound: number;
    placingBets: number;
    lockingBet: number;
    showingResult: number;
    wholeTurn: number;
};
