import GameData from "../game-data";
import { ProvablyFair } from "sc-game-base/src/core/game-data";

export default class ProvablyFairConsumer {
    gameData: GameData;
    MaxCombinedClientSeeds = 5;
    ClientSeedRange = { min: 0, max: 9999 };

    constructor(gameData: GameData, maxCombinedClientSeeds: number) {
        this.gameData = gameData;
        if (maxCombinedClientSeeds) {
            this.MaxCombinedClientSeeds = maxCombinedClientSeeds;
        }
    }

    addClientSeed({ name, clientSeed }: { name: string; clientSeed: string }) {
        const { clientSeeds } = this.gameData.pf;

        if (clientSeeds.length < this.MaxCombinedClientSeeds) {
            clientSeeds.push({ name, clientSeed });
        }
    }

    setServerSeed(serverSeed: string) {
        this.gameData.pf.serverSeed = serverSeed;
    }

    setServerSeedHash(serverSeedHash: string) {
        this.gameData.pf.serverSeedHash = serverSeedHash;
    }

    reset() {
        this.gameData.pf = { clientSeeds: [] as Record<string, string>[], serverSeed: "" } as ProvablyFair;
    }

    generateClientSeeds(bets: any): Record<string, string>[] {
        const clientSeeds = [] as Record<string, string>[];
        const sortedBets = [...bets].sort((b1, b2) => b1.time - b2.time);
        sortedBets.slice(0, this.MaxCombinedClientSeeds).forEach(({ name, clientSeed }) => clientSeeds.push({ name, clientSeed }));

        return clientSeeds;
    }

    updateClientSeeds(clientSeeds: Record<string, string>[]) {
        this.gameData.pf.clientSeeds = clientSeeds;
    }
}
