import { ConfigPlugin, withProjectBuildGradle } from "expo/config-plugins";

const mavenPath = `
allprojects {
  repositories {
  maven {
      url("$rootDir/../node_modules/detox/Detox-android")
    }
  }
}
`;

const patchProjectGradle: ConfigPlugin = (config) => {
  return withProjectBuildGradle(config, (config) => {
    config.modResults.contents += mavenPath;
    return config;
  });
};

export default patchProjectGradle;
