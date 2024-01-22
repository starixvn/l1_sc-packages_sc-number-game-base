declare namespace _default {
    export { init };
    export { post };
    export { getBearerToken };
}
export default _default;
declare function init(configs: any): Promise<void>;
declare function post(endpoint: any, params: any, options: any): Promise<any>;
declare function getBearerToken(): any;
