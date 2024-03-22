import { TableHttpRouter } from "sc-game-base/src/table/routers";
import GameData from "../game-data";

export default class HttpRouter extends TableHttpRouter {
    declare gameData: GameData;
    collectOnlineUsers() {
        const onlineUsers = super.collectOnlineUsers();
        const realPlayers = onlineUsers.realUsers?.filter((user) => this.gameData.players[user.id]);
        const testPlayers = onlineUsers.testUsers?.filter((user) => this.gameData.players[user.id]);

        return {
            ...onlineUsers,
            totalRealPlayer: realPlayers?.length,
            realUsers: realPlayers,
            totalTestPlayer: testPlayers?.length,
            testUsers: testPlayers,
        };
    }
}
