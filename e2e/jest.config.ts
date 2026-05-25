import { Config } from "@jest/types";

module.exports = {
  preset: "ts-jest",
  rootDir: "..",
  testMatch: ["<rootDir>/e2e/**/*.test.ts"],
  // 120s per test — single-worker fit within 60s comfortably, but with the
  // `--maxWorkers 2` parallel sims in CI the per-test runtime drifts up under
  // host CPU contention (the longest "three servers" case clocked ~92s on
  // PR #161's first run). 120s leaves headroom without masking real hangs.
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: "detox/runners/jest/globalSetup",
  globalTeardown: "detox/runners/jest/globalTeardown",
  reporters: ["detox/runners/jest/reporter"],
  testEnvironment: "detox/runners/jest/testEnvironment",
  verbose: true,
  setupFilesAfterEnv: ["<rootDir>/e2e/setup-jest.ts"],
} satisfies Config.InitialOptions;
