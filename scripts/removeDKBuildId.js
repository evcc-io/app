const {
  withAppBuildGradle,
} = require("@expo/config-plugins/build/plugins/android-plugins.js");

const withNDKBuildId = (config) => {
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

module.exports = withNDKBuildId;
