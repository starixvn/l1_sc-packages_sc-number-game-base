export default class TableUserSignInConsumer extends UserSignInConsumer {
    /**
     * @param {TableGameDefinition} definition
     * @param {TableGameData} gameData
     * @param {TableUserSignInPublisher} userSignInPublisher
     * @param {Object} appConfigs
     */
    constructor(definition: TableGameDefinition, gameData: TableGameData, userSignInPublisher: TableUserSignInPublisher, playGamePermissionValidator: any, appConfigs: any, gameManagementApiClientFactory: any);
    definition: TableGameDefinition;
}
import UserSignInConsumer from "./../../core/event-consumers/user-signin-consumer";
import TableGameDefinition from "./../table-game-definition";
import TableGameData from "./../table-game-data";
import TableUserSignInPublisher from "./../event-publishers/table-user-signin-publisher";
