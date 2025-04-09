import { type ConfigPlugin } from "@expo/config-plugins";
import { withAppBuildGradle } from "@expo/config-plugins/build/plugins/android-plugins.js";
import  { type ExpoConfig } from "@expo/config-types/build/ExpoConfig.js";

const withNDKBuildId: ConfigPlugin = (config: ExpoConfig) => {
  return withAppBuildGradle(config, (gradleConfig) => {
    if (typeof gradleConfig.modResults.contents === "string") {
      gradleConfig.modResults.contents =
        gradleConfig.modResults.contents.replace(
          "defaultConfig {",
          `defaultConfig {
            externalNativeBuild {
                ndkBuild {
                    arguments "APP_LDFLAGS=--build-id=none"
                }
            }`,
        );
    }
    return gradleConfig;
  });
};

export default withNDKBuildId;
