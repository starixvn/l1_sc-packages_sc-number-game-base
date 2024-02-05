export const getBetOdds = (probabilities: Record<string, number>, margins: Record<string, number>[] = []): Record<string, number> => {
    const sortedMargins = margins.toSorted((margin) => margin.max);
    return Object.keys(probabilities).reduce((result, choice) => {
        const prob = probabilities[choice];
        const originalOdds = probabilityToBetOdds(prob);
        const margin = sortedMargins.find((m) => originalOdds <= m.max)?.[choice];
        result[choice] = probabilityToBetOdds(prob, margin);
        return result;
    }, {} as any);
};

export const probabilityToBetOdds = (prob: number, margin = 0) => {
    return (1 - margin) / prob;
};
