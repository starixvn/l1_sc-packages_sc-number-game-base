export default class RoundResultConsumer {
    constructor(gameData: any, definition: any, roundResultPublisher: any, resultsRepository: any);
    gameData: any;
    definition: any;
    roundResultPublisher: any;
    resultsRepository: any;
    generateResultAndPublishHash(lastResultRecord: any): Promise<void>;
    generateResult(): any;
    buildResultHash(): {
        roundId: any;
        hashValue: any;
        rawValue: string;
    };
    createResultRecord(): Promise<void>;
    getNewDate(): Date;
}
