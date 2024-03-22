import { TableHttpRouter } from "sc-game-base/src/table/routers";
import GameData from "../game-data";

export default class HttpRouter extends TableHttpRouter {
    declare gameData: GameData;
    collectOnlineUsers() {
        const onlineUsers = super.collectOnlineUsers();
        const playerNamesInGame = Object.values(this.gameData.players)?.map((player: any) => player.name);
        const realPlayers = onlineUsers.realUsers?.filter((user) => playerNamesInGame.includes(user.name));
        const testPlayers = onlineUsers.testUsers?.filter((user) => playerNamesInGame.includes(user.name));

        return {
            ...onlineUsers,
            totalRealPlayer: realPlayers?.length,
            realUsers: realPlayers,
            totalTestPlayer: testPlayers?.length,
            testUsers: testPlayers,
        };
    }
}
