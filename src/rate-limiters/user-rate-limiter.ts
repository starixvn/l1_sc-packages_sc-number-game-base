import BaseRateLimiter from "./base-rate-limiter";

export default class UserRateLimiter extends BaseRateLimiter {
    constructor(appConfigs: any) {
        const limit = appConfigs.socketOptions.maxRequestsPerInterval;
        const interval = appConfigs.socketOptions.rateLimitInterval;
        super(limit, interval);
    }

    verify(realPlayer: any) {
        return super.verify(realPlayer.UID);
    }
}
