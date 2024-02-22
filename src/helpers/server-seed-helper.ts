import Chance from "chance";
import cryptoRandomString from "crypto-random-string";
import { Random, MersenneTwister19937 } from "random-js";
import Randomstring from "randomstring";
import { customAlphabet } from "nanoid";

const Characters = [...Array(26)].reduce(
    (res, _, i) => res.concat([String.fromCharCode(65 + i), String.fromCharCode(97 + i)]),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
);

const nanoid = customAlphabet(Characters.toString().replaceAll(",", ""));

function random1(length: number) {
    const chance = new Chance();
    return chance.string({ length });
}

function random2(length: number) {
    const randomJs = new Random(MersenneTwister19937.autoSeed());
    return randomJs.string(length);
}

function random3(length: number) {
    return Randomstring.generate({ length });
}

function random4(length: number) {
    return cryptoRandomString({ length, type: "url-safe" });
}

function random5(length: number) {
    return nanoid(length);
}

function random6(length: number) {
    const chance = new Chance();

    return chance.pickset(Characters, length).toString().replaceAll(",", "");
}

const randomModes: any = {
    1: [random1, random2, random3, random4, random5],
    2: [random2, random3, random6],
    3: [random6, random5],
};

const generateServerSeed = (randomMode: number, length = 40) => {
    const randomFunctions: Function[] = randomModes[randomMode] || randomModes[1];
    const chance = new Chance();
    const randomStringFunc = chance.pickone(randomFunctions);

    return randomStringFunc(length);
};

export { generateServerSeed };
