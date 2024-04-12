import UserRateLimiter from "../../../src/rate-limiters/user-rate-limiter";
import BaseRateLimiter from "../../../src/rate-limiters/base-rate-limiter";
import Chance from "chance";

describe("UserRateLimiter", () => {
    const interval = 1000;
    const maxRequests = 100;
    const appConfigs = {
        socketOptions: {
            maxRequestsPerInterval: maxRequests, // default 1000
            rateLimitInterval: interval, // default 10 * 1000
        },
    };
    let rateLimiter: UserRateLimiter;

    beforeEach(() => {
        rateLimiter = new UserRateLimiter(appConfigs);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("inherit BaseRateLimiter", () => {
        expect(rateLimiter instanceof BaseRateLimiter);
    });

    describe("constructor", () => {
        const chance = new Chance();
        let rateLimiter: UserRateLimiter;

        describe("when called with argument", () => {
            it("should construct base constructor with correct value", () => {
                // Arrange
                const maxRequestsPerInterval = chance.natural();
                const rateLimitInterval = chance.natural();

                const configs = {
                    socketOptions: {
                        maxRequestsPerInterval: maxRequestsPerInterval,
                        rateLimitInterval: rateLimitInterval,
                    },
                };

                // Act
                rateLimiter = new UserRateLimiter(configs);

                // Assert
                expect(rateLimiter.interval).toBe(rateLimitInterval);
                expect(rateLimiter.limit).toBe(maxRequestsPerInterval);
            });
        });
    });

    describe("verify", () => {
        describe("when called", () => {
            it("should call super.verify", () => {
                // Arrange
                const realPlayer = {
                    UID: "testId123",
                };

                BaseRateLimiter.prototype.verify = jest.fn();

                // Act
                rateLimiter.verify(realPlayer);

                // Assert
                expect(BaseRateLimiter.prototype.verify).toHaveBeenCalledWith("testId123");
            });
        });
    });
});
