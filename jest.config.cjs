module.exports = async () => {
    return {
        rootDir: "./",
        verbose: true,
        transform: {
            "^.+\\.ts?$": "ts-jest",
            "^.+\\.js?$": "babel-jest",
        },
        transformIgnorePatterns: [
            "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|jest-auto-fixture|sc-game-management-client|prom-client)/.*)",
        ],
        preset: "ts-jest",
        testEnvironment: "node",
        testResultsProcessor: "jest-sonar-reporter",
        reporters: ["default", ["jest-junit", { outputDirectory: "coverage" }]],
        coverageReporters: ["clover", "lcov", "text-summary", "cobertura"],
        coverageDirectory: "coverage",
    };
};
