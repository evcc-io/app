import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "expo/config-plugins";
import disableDependencyMetadata from "./src/disableDependencyMetadata";
import excludeNonfreeDependencies from "./src/excludeNonfreeDependencies";
import removeNDKBuildId from "./src/removeNDKBuildId";

const configureFdroid: ConfigPlugin = (config) => {
  return withPlugins(config, [
    disableDependencyMetadata,
    excludeNonfreeDependencies,
    removeNDKBuildId,
  ]);
};

export default createRunOncePlugin(configureFdroid, "configure-fdroid");
