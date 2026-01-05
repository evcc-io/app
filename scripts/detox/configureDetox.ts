import {
  ConfigPlugin,
  createRunOncePlugin,
  withPlugins,
} from "expo/config-plugins";
import patchAppGradle from "./src/patchBuildGradles/patchAppGradle";
import patchProjectGradle from "./src/patchBuildGradles/patchProjectGradle";
import addAndroidTest from "./src/addAndroidTest";
import enableUnencryptedTraffic, {
  SubdomainsType,
} from "./src/enableUnencryptedTraffic";
import increaseAllowedMemory from "./src/increaseAllowedMemory";

const configureDetox: ConfigPlugin<
  {
    /**
     * Subdomains to add to the network security config.
     * Pass `["10.0.3.2", "localhost"]` to use Genymotion emulators instead of Google emulators.
     * Pass `*` to allow all domains.
     *
     * @default ["10.0.2.2", "localhost"] // (Google emulators)
     */
    subdomains?: SubdomainsType;
  } | void
> = (config, { subdomains } = {}) => {
  return withPlugins(config, [
    patchProjectGradle,
    patchAppGradle,
    addAndroidTest,
    increaseAllowedMemory,
    [
      enableUnencryptedTraffic,
      { subdomains: subdomains ?? ["10.0.2.2", "localhost"] },
    ],
  ]);
};

export default createRunOncePlugin(configureDetox, "configure-detox");
