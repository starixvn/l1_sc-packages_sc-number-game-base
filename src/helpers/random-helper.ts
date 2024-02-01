import Chance from "chance";
import { MersenneTwister19937, Random } from "random-js";
import { shuffle as d3Shuffle } from "d3-array";
import lodashShuffle from "lodash/shuffle";

const chance = new Chance();
const random = new Random(MersenneTwister19937.autoSeed());
const generateSeeds = (numberOfSeeds: number, excludeNumbers: number[]) => {
    const result = [...Array(numberOfSeeds + 1).keys()].slice(1);

    if (excludeNumbers.length) {
        return result.filter((n) => !excludeNumbers.includes(n));
    }

    return result;
};

const random1 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) =>
    chance.shuffle(chance.shuffle(chance.shuffle(generateSeeds(numberOfSeeds, excludeNumbers)))).slice(0, numberOfPicked);

const random2 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(generateSeeds(numberOfSeeds, excludeNumbers)))).slice(0, numberOfPicked);
};

const random3 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) =>
    lodashShuffle(lodashShuffle(lodashShuffle(generateSeeds(numberOfSeeds, excludeNumbers)))).slice(0, numberOfPicked);

const random4 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) =>
    chance.pickset(generateSeeds(numberOfSeeds, excludeNumbers), numberOfPicked);

const random5 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) =>
    random.shuffle([...generateSeeds(numberOfSeeds, excludeNumbers)]).slice(0, numberOfPicked);

const random6 = (numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[]) =>
    random.sample(generateSeeds(numberOfSeeds, excludeNumbers), numberOfPicked);

export const randomModes: any = {
    1: [random1, random2, random3, random4],
    2: [random3, random4, random5, random6],
    3: [random1, random2, random5, random6],
};

export default (randomMode: number, numberOfPicked: number, numberOfSeeds: number, excludeNumbers: number[] = []) => {
    const randomShuffles: Function[] = randomModes[randomMode] || randomModes[1];
    return chance.pickone(randomShuffles)(numberOfPicked, numberOfSeeds, excludeNumbers);
};
