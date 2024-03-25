import { TableHttpRouter } from "sc-game-base/src/table/routers";
import GameData from "../game-data";

export default class HttpRouter extends TableHttpRouter {
    declare gameData: GameData;
    collectOnlineUsers() {
        const onlineUsers = super.collectOnlineUsers();
        const realPlayers = onlineUsers.realUsers?.filter((user) => this.gameData.players[user.UID]);
        const testPlayers = onlineUsers.testUsers?.filter((user) => this.gameData.players[user.UID]);

        return {
            ...onlineUsers,
            totalRealPlayer: realPlayers?.length,
            realUsers: realPlayers,
            totalTestPlayer: testPlayers?.length,
            testUsers: testPlayers,
        };
    }

    mapRealUsers(players: any) {
        const testUsers: any[] = [];
        const realUsers: any[] = [];

        players.forEach((player: any) => {
            if (player && player.session && player.socketClient && player.socketClient.connected) {
                const user = {
                    UID: player.UID,
                    name: player.session.playerName,
                    id: player.session.playerId,
                    currency: player.session.currencyName,
                    character: player.session.characterName,
                    system: player.session.system,
                    operatorId: player.session.operatorId,
                    partnerId: player.session.operatorId,
                };

                if (player.session.isTestCurrency) {
                    testUsers.push(user);
                } else {
                    realUsers.push(user);
                }
            }
        });

        return { testUsers, realUsers };
    }
}
