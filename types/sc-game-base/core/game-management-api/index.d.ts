export function getOrDefault(requestPromise: any, defaultValue: any): Promise<any>;
export function post(requestPromise: any): Promise<any>;
export function callAndForget(requestPromise: any): void;
export default class GameManagementApiClientFactory {
    constructor(appConfigs: any);
    gameManagementApiSettings: any;
    apiClient: gameManagementClient;
    instance(): gameManagementClient;
}
import { gameManagementClient } from "sc-game-management-client";
