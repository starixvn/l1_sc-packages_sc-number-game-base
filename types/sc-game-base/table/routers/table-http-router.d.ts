export default class TableHttpRouter extends HttpRouter {
    collectOnlineUsers(): {
        bots: {
            name: any;
            red: any;
        }[];
        totalBots: number;
        totalRealPlayer: number;
        realUsers: any[];
        totalTestPlayer: number;
        testUsers: any[];
    };
}
import { HttpRouter } from "./../../core/routers/";
