import { ConfigPlugin, withAppBuildGradle } from "@expo/config-plugins";
import { ExpoConfig } from "@expo/config-types";

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
