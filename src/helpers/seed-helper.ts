import crypto from "crypto";

function getMergeClientSeed(clientSeeds: Record<string, string>[] = []) {
    return "".concat(...clientSeeds.map((data) => Object.values(data)[0]));
}

function getSHA256Hash(seed: string) {
    return crypto.createHash("sha256").update(seed).digest("hex");
}

function getSHA512Hash(seed: string) {
    return crypto.createHash("sha512").update(seed).digest("hex");
}

export { getMergeClientSeed, getSHA256Hash, getSHA512Hash };
