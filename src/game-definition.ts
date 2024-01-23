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
        generateRawResultForHash: Function
    ) {
        super(
            { id, name, durations, choices, choicesMapper, hedgeBetGroups, numberOfRoundHistory, historyPageSize },
            generateResult,
            settle,
            generateRawResultForHash
        );
        this.numberOfTurnsPerRound = numberOfTurnsPerRound;
    }
    numberOfTurnsPerRound: number;
}
export type Duration = {
    wholeRound: number;
    placingBets: number;
    lockingBet: number;
    showingResult: number;
    wholeTurn: number;
};
