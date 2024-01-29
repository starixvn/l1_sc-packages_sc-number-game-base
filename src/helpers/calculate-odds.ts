export const getBetOdds = (probabilities: Record<string, number>, margins: Record<string, number>): Record<string, number> => {
    const odds = Object.entries(probabilities).map(([choice, value]) => {
        return [choice, probabilityToBetOdds(value, margins[choice])];
    });

    return Object.fromEntries(odds);
};

export const probabilityToBetOdds = (prob: number, margin: number) => {
    return (1 - margin) / prob;
};
