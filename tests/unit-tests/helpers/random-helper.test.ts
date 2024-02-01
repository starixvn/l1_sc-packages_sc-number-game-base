import { generateRandomNumbers } from "../../../src/helpers";

describe("RandomHelper tests", () => {
    const randomModes = [1, 2, 3];
    const total = 1_000;
    const numberOfSeeds = 10;

    it.each(randomModes)("should generate valid numbers when not exclude numbers", (mode) => {
        const numberOfPicked = 2;
        for (let i = 0; i < total; i++) {
            const numbers = generateRandomNumbers(mode, numberOfPicked, numberOfSeeds);
            expect(numbers).toHaveLength(numberOfPicked);
            expect(numbers[0]).not.toBe(numbers[1]);
            expect(numbers[0]).toBeLessThanOrEqual(numberOfSeeds);
            expect(numbers[0]).toBeGreaterThan(0);
            expect(numbers[1]).toBeLessThanOrEqual(numberOfSeeds);
            expect(numbers[1]).toBeGreaterThan(0);
        }
    });

    it.each(randomModes)("should generate valid numbers when there are exclude numbers", (mode) => {
        const excludeNumbers = [1, 2, 3, 4];
        for (let i = 0; i < total; i++) {
            const numbers = generateRandomNumbers(mode, 1, numberOfSeeds, excludeNumbers);
            expect(numbers[0]).toBeLessThanOrEqual(numberOfSeeds);
            expect(numbers[0]).toBeGreaterThan(0);
            expect(excludeNumbers).not.toContain(numbers[0]);
        }
    });
});
