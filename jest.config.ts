import type { Config } from "jest";

const defaultTestPaths = "tests";
const testMatch = (process.env.TEST_PATHS || defaultTestPaths)
    .split(",")
    .map((path) => `**/${path.replace("./", "")}/**/?(*.)+(spec|test).+(ts)`);
const config: Config = {
    preset: "ts-jest/presets/js-with-ts",
    coverageDirectory: "coverage",
    testEnvironment: "node",
    transform: {
        "^.+\\.(j|t)sx?$": ["ts-jest", { tsconfig: "<rootDir>/tests/tsconfig.json" }],
    },
    transformIgnorePatterns: [
        "node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|jest-auto-fixture|sc-game-management-client|prom-client)/.*)",
    ],
    testResultsProcessor: "jest-sonar-reporter",
    coverageReporters: ["cobertura", "text-summary", "text", "lcov"],
    reporters: [
        "default",
        [
            "jest-junit",
            {
                outputDirectory: "coverage",
            },
        ],
    ],
    testMatch,
};

export default config;
