import { withSettingsGradle, type ConfigPlugin } from "expo/config-plugins";

const excludeNonfreeDependencies: ConfigPlugin = (config) => {
  return withSettingsGradle(config, (gradleConfig) => {
    console.log(
      "🗑 Script: Excluding non free dependencies from the release build",
    );

    if (typeof gradleConfig.modResults.contents === "string") {
      gradleConfig.modResults.contents =
        gradleConfig.modResults.contents.replace(
          "expoAutolinking.useExpoModules()",
          `def isReleaseBuild = gradle.startParameter.taskNames.any { it.toLowerCase().contains('release')}
if (isReleaseBuild) {
  expoAutolinking.exclude = ["expo-dev-launcher", "expo-dev-client"]
}
expoAutolinking.useExpoModules()
`,
        );
    }
    return gradleConfig;
  });
};

module.exports = excludeNonfreeDependencies;
