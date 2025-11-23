import { ConfigPlugin, withGradleProperties } from "expo/config-plugins";

const increaseAllowedMemory: ConfigPlugin = (config) => {
  return withGradleProperties(config, (config) => {
    config.modResults.forEach((item, index) => {
      if (item.type === "property" && item.key === "org.gradle.jvmargs") {
        config.modResults[index] = {
          ...item,
          value: item.value.replace("-Xmx2048m", "-Xmx2g"),
        };
      }
    });

    return config;
  });
};

export default increaseAllowedMemory;
