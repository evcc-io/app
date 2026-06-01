import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "expo/config-plugins";
import disableDependencyMetadata from "./src/disableDependencyMetadata";
import { isFdroidBuild } from "scripts/buildType";

const configureFdroid: ConfigPlugin = (config) => {
  if (!isFdroidBuild) return config;
  return withPlugins(config, [disableDependencyMetadata]);
};

export default createRunOncePlugin(configureFdroid, "configure-fdroid");
