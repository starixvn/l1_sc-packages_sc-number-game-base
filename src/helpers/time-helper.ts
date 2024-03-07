export const getCurrentTimeOfTurn = (remainingTime: number, wholeTurn: number, numberOfTurnsPerRound: number) => {
    if (remainingTime >= wholeTurn * numberOfTurnsPerRound) {
        return (remainingTime % wholeTurn) + wholeTurn;
    }
    return remainingTime % wholeTurn;
};

export const getCurrentTurn = (remainingTime: number, wholeTurn: number, numberOfTurnsPerRound: number) => {
    return numberOfTurnsPerRound - Math.min(Math.floor(remainingTime / wholeTurn) + 1, numberOfTurnsPerRound) + 1;
};
