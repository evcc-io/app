const launchArgs = {
  disableAnimations: true,
};

/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: "jest",
      config: "e2e/jest.config.ts",
    },
    jest: {
      setupTimeout: 120000,
    },
    retries: 1,
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
        enabled: true,
        keepOnlyFailedTestsArtifacts: true,
        takeWhen: {
          testStart: true,
          testFailure: true,
          testDone: true,
          appNotReady: true,
        },
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
      launchArgs,
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Release-iphonesimulator/evcc.app",
      build:
        "xcodebuild -workspace ios/evcc.xcworkspace -scheme evcc -configuration Release -derivedDataPath ios/build -quiet | xcbeautify --renderer github-actions",
    },
    "android.release": {
      launchArgs,
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build: `cd android && "./gradlew" assembleRelease assembleAndroidTest -DtestBuildType=release --parallel --build-cache --no-daemon`,
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 16",
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
