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
  },
  apps: {
    "ios.release": {
      launchArgs,
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/YOUR_APP.app",
      build:
        "xcodebuild -workspace ios/YOUR_APP.xcworkspace -scheme YOUR_APP -configuration Release -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "android.release": {
      launchArgs,
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/release/app-release.apk",
      build: `cd android && "./gradlew" assembleRelease assembleAndroidTest -DtestBuildType=release`,
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 15",
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
        avdName: "Medium_Phone_API_36.0",
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
