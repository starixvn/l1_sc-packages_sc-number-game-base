import { TableGameData } from "sc-game-base/src/table";
export default class GameData extends TableGameData {
    playerBetCount: Record<string, string[]> = {};
    odds: Record<string, number> = {};
    drawId = 0;
    roundResult: any;
    gameState: any;
}
