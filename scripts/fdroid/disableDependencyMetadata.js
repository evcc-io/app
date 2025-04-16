const {
  withAppBuildGradle,
} = require("@expo/config-plugins/build/plugins/android-plugins.js");
const { log } = require("console");

const withNDKBuildId = (config) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (typeof gradleConfig.modResults.contents === "string") {
      gradleConfig.modResults.contents =
        gradleConfig.modResults.contents.replace(
          "android {",
          `android {
    dependenciesInfo {
        // Disables dependency metadata when building APKs.
        includeInApk = false
        // Disables dependency metadata when building Android App Bundles.
        includeInBundle = false
    }
`,
        );
    }
    return gradleConfig;
  });
};

module.exports = withNDKBuildId;
