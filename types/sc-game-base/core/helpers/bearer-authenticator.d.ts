export default class BearerAuthenticator {
    constructor(authConfigs: any);
    authConfigs: any;
    autoUpdateToken(): Promise<void>;
    refresh(): Promise<void>;
    isTokenExpired(): boolean;
    updateToken(): Promise<void>;
    token: any;
    expired: any;
    getBearerToken(): Promise<{
        token: any;
        expired: any;
    }>;
    formatToken(): string;
}
