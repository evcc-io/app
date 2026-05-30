import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "expo/config-plugins";
import disableDependencyMetadata from "./src/disableDependencyMetadata";

const configureFdroid: ConfigPlugin = (config) => {
  return withPlugins(config, [disableDependencyMetadata]);
};

export default createRunOncePlugin(configureFdroid, "configure-fdroid");
