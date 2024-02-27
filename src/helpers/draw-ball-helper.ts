export const generateRemainingBalls = (totalBalls: number, drawnBalls: number[]) => {
    const result = [...Array(totalBalls + 1).keys()].slice(1);

    if (drawnBalls.length) {
        return result.filter((n) => !drawnBalls.includes(n));
    }

    return result;
};
