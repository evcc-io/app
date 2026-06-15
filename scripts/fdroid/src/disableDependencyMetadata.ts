import { withAppBuildGradle, type ConfigPlugin } from "expo/config-plugins";

const withNDKBuildId: ConfigPlugin = (config) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    console.log("» F-Droid config plugin: Removing dependency metadata from build.gradle");

    if (typeof gradleConfig.modResults.contents === "string") {
      gradleConfig.modResults.contents =
        gradleConfig.modResults.contents.replace(
          "android {",
          `android {
    dependenciesInfo {
        // Disables dependency metadata when building APKs.
        includeInApk = true
        // Disables dependency metadata when building Android App Bundles.
        includeInBundle = false
    }
`,
        );
    }
    return gradleConfig;
  });
};

export default withNDKBuildId;
