import { ConfigPlugin, withGradleProperties } from "expo/config-plugins";

// Expo's default `MaxMetaspaceSize=512m` is too low for release builds and
// intermittently crashes the Gradle daemon with `OutOfMemoryError: Metaspace`.
const JVM_ARGS = "-Xmx4g -XX:MaxMetaspaceSize=2g";

const increaseGradleMemory: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.forEach((item, index) => {
      if (item.type === "property" && item.key === "org.gradle.jvmargs") {
        config.modResults[index] = { ...item, value: JVM_ARGS };
      }
    });
    return config;
  });
};

export default increaseGradleMemory;
