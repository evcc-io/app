import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "expo/config-plugins";
import disableDependencyMetadata from "./src/disableDependencyMetadata";
import excludeNonfreeDependencies from "./src/excludeNonfreeDependencies";
import removeDKBuildId from "./src/removeDKBuildId";

const configureFdroid: ConfigPlugin = (config) => {
  return withPlugins(config, [
    disableDependencyMetadata,
    excludeNonfreeDependencies,
    removeDKBuildId,
  ]);
};

export default createRunOncePlugin(configureFdroid, "configure-fdroid");
