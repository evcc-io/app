const basicLaunchArgs = {
  testingEnvironment: true,
};

function createDetoxURLBlacklistRegex(patterns) {
  return `\\("${patterns.map((s) => `.*${s}.*`).join('","')}"\\)`;
}

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.ts",
    },
    bail: true,
  },
  artifacts: {
    rootDir: "./e2e/artifacts",
    plugins: {
      log: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      screenshot: {
        enabled: false,
      },
      video: {
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
      },
      uiHierarchy: {
        enabled: true,
      },
    },
  },
  apps: {
    "ios.release": {
      launchArgs: {
        ...basicLaunchArgs,
        detoxURLBlacklistRegex: createDetoxURLBlacklistRegex([
          "demo.evcc.io",
          "localhost",
        ]),
      },
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/evcc.app",
      build:
        "xcodebuild -workspace ios/evcc.xcworkspace -scheme evcc -configuration Release -destination 'platform=iOS Simulator,name=iPhone 17 Pro' -derivedDataPath ios/build -quiet | xcbeautify --renderer github-actions",
    },
    "android.release": {
      launchArgs: {
        ...basicLaunchArgs,
        detoxURLBlacklistRegex: createDetoxURLBlacklistRegex([
          "demo.evcc.io",
          "10.0.2.2",
        ]),
      },
      reversePorts: [7070, 7080, 7081, 7082],
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build: `cd android && "./gradlew" :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release --parallel --build-cache`,
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 17 Pro",
      },
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "test",
      },
    },
  },
  configurations: {
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
    "android.att.release": {
      device: "attached",
      app: "android.release",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },
  },
};
