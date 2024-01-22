export default class MetricQuery {
    /**
     * @param {BaseMetrics} baseMetrics
     */
    constructor(appConfigs: any, baseMetrics: BaseMetrics);
    appConfigs: any;
    baseMetrics: BaseMetrics;
    getMetrics(metricSecretKey: any): string;
}
import BaseMetrics from "../base-metrics";
