const defaultRateLimit = {
    limit: 1000, // 1000 requests
    interval: 10 * 1000, // 10 seconds
};
export default class BaseRateLimiter {
    limit: number;
    interval: number;
    storage: Record<any, LimitStorage>;

    constructor(limit: number, interval: number) {
        this.limit = limit ?? defaultRateLimit.limit;
        this.interval = interval ?? defaultRateLimit.interval;
        this.storage = {};
    }

    verify(limiterId: any) {
        if (!limiterId) {
            return true;
        }

        const currentTime = new Date();

        if (!this.storage[limiterId] || Math.abs(currentTime.valueOf() - this.storage[limiterId].lastClear.valueOf()) > this.interval) {
            this.storage[limiterId] = {
                lastClear: currentTime,
                count: 0,
            };
        }

        this.storage[limiterId].count++;

        if (this.storage[limiterId].count > this.limit) {
            return false;
        }

        return true;
    }
}

export type LimitStorage = {
    lastClear: Date;
    count: number;
};
