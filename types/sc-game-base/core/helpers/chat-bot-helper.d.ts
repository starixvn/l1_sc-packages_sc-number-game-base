declare namespace _default {
    export { init };
    export { post };
    export { sendBoostedOddsMessage };
}
export default _default;
declare function init(configs: any): Promise<void>;
declare function post(channel: any, message: any, options: any): Promise<void>;
declare function sendBoostedOddsMessage(message: any): Promise<void>;
