import { withAppBuildGradle, type ConfigPlugin } from "expo/config-plugins";

const withNDKBuildId: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    console.log("🗑 Script: Removing dependency metadata from build.gradle");

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
