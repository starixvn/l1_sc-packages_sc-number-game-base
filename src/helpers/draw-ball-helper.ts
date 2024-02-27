export const generateRemainingBalls = (totalBalls: number, drawBalls: number[]) => {
    const result = [...Array(totalBalls + 1).keys()].slice(1);

    if (drawBalls.length) {
        return result.filter((n) => !drawBalls.includes(n));
    }

    return result;
};
