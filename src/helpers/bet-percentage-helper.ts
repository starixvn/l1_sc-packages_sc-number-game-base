const calculateBetPercentage = (playerBetCount: Record<string, string[]>) => {
    const total = Object.values(playerBetCount).reduce((t, count) => t + count.length, 0);
    return Object.keys(playerBetCount).reduce((result, choice) => {
        result[choice] = parseFloat(((playerBetCount[choice].length * 100) / total).toFixed(2));
        return result;
    }, {} as Record<string, number>);
};

const calculatePlayerBetCount = (playerBetCount: Record<string, string[]>) => {
    return Object.keys(playerBetCount).reduce((result, choice) => {
        result[choice] = playerBetCount[choice].length;
        return result;
    }, {} as Record<string, number>);
};

export default { calculateBetPercentage, calculatePlayerBetCount };
