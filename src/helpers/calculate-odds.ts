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
    const odds = (1 - margin) / prob;

    return odds > 20 ? Math.floor(odds) : Number((Math.floor(odds * 100) / 100).toFixed(2));
};
