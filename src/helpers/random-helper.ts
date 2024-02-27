import Chance from "chance";
import { MersenneTwister19937, Random } from "random-js";
import { shuffle as d3Shuffle } from "d3-array";
import lodashShuffle from "lodash/shuffle";

const chance = new Chance();
const random = new Random(MersenneTwister19937.autoSeed());

const random1 = (balls: number[]) => chance.shuffle(chance.shuffle(chance.shuffle(balls)))[0];

const random2 = (balls: number[]) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(balls)))[0];
};

const random3 = (balls: number[]) => lodashShuffle(lodashShuffle(lodashShuffle(balls)))[0];

const random4 = (balls: number[]) => chance.pickone(balls);

const random5 = (balls: number[]) => random.shuffle([...balls])[0];

const random6 = (balls: number[]) => random.pick(balls, 1);

export const randomModes: any = {
    1: [random1, random2, random3, random4],
    2: [random3, random4, random5, random6],
    3: [random1, random2, random5, random6],
};

export const getRandomBallFromArrayOfBalls = (randomMode: number, balls: number[] = []): number => {
    const randomShuffles: Function[] = randomModes[randomMode] || randomModes[1];
    return chance.pickone(randomShuffles)(balls);
};
