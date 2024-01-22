export default class RoundQuery {
    /**
     * @param {mongoose.Model} roundsRepository
     */
    constructor(roundsRepository: mongoose.Model);
    roundsRepository: mongoose.Model;
    convertSettlementResult(roundResult: any): void;
    convertResult(round: any): void;
    getList(limit: any, projections: any): Promise<any>;
    getOne(id: any, projections?: {
        _id: boolean;
    }): Promise<any>;
}
