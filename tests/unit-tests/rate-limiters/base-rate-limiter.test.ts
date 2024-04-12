import BaseRateLimiter from "../../../src/rate-limiters/base-rate-limiter";

describe("BaseRateLimiter", () => {
    const interval = 1000;
    const maxRequests = 100;
    let rateLimiter: BaseRateLimiter;

    beforeEach(() => {
        rateLimiter = new BaseRateLimiter(maxRequests, interval);
    });

    describe("verify", () => {
        describe("when exceeding rate limit during interval", () => {
            it("should return false", () => {
                // Arrange
                const id = "testId123";

                // Act
                for (let i = 0; i < maxRequests; i++) {
                    rateLimiter.verify(id);
                }

                const actual = rateLimiter.verify(id);

                // Assert
                expect(actual).toBe(false);
            });
        });

        describe("when NOT exceeding rate limit during interval", () => {
            it("should return true", async () => {
                // Arrange
                const id = "testId123";

                // Act
                for (let i = 0; i < maxRequests; i++) {
                    rateLimiter.verify(id);
                }

                const promise = new Promise((resolve) => {
                    setTimeout(resolve, interval);
                });

                await promise;

                const actual = rateLimiter.verify(id);

                // Assert
                expect(actual).toBe(true);
            });
        });
    });
});
