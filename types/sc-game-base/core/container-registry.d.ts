export default class ContainerRegistry {
    /**
     * @param {InjectionMode} defaultInjectionMode
     */
    constructor(defaultInjectionMode?: Record<import("awilix").InjectionModeType, import("awilix").InjectionModeType>);
    container: import("awilix").AwilixContainer<any>;
    /**
     * @param {Object} appConfigs
     * @param {GameDefinition} definition
     * @param {GameData} gameData
     */
    register(appConfigs: any, definition: GameDefinition, gameData: GameData): import("awilix").AwilixContainer<any>;
    registerModels(): void;
    registerApis(): void;
    registerPublishers(): void;
    registerConsumers(): void;
    registerCrons(): void;
    registerRouters(): void;
    registerValidators(): void;
    registerGameManagementService(): void;
}
import GameDefinition from "./game-definition";
import GameData from "./game-data";
