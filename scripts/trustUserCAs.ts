import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withAndroidManifest,
  withDangerousMod,
  withPlugins,
} from "expo/config-plugins";
import fs from "fs";
import path from "path";

const NETWORK_SECURITY_CONFIG_FILE = "network_security_config.xml";

/**
 * Once a network security config is present, Android ignores the manifest's
 * `android:usesCleartextTraffic` flag entirely. Plain-HTTP access to local
 * evcc instances is the primary use case, so cleartext must be re-enabled
 * here explicitly.
 *
 * May not have new lines or spaces in the beginning.
 * Otherwise build fails with:
 * "AAPT: error: XML or text declaration not at start of entity"
 */
const NETWORK_SECURITY_CONFIG = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="true">
    <trust-anchors>
      <certificates src="system" />
      <certificates src="user" />
    </trust-anchors>
  </base-config>
</network-security-config>
`;

const withNetworkSecurityConfigFile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resXmlPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(resXmlPath, { recursive: true });
      fs.writeFileSync(
        path.join(resXmlPath, NETWORK_SECURITY_CONFIG_FILE),
        NETWORK_SECURITY_CONFIG,
        "utf-8",
      );
      return config;
    },
  ]);
};

const withNetworkSecurityConfigManifest: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    if (!application.$["android:networkSecurityConfig"]) {
      application.$["android:networkSecurityConfig"] =
        "@xml/network_security_config";
    }
    return config;
  });
};

const trustUserCAs: ConfigPlugin = (config) => {
  return withPlugins(config, [
    withNetworkSecurityConfigManifest,
    withNetworkSecurityConfigFile,
  ]);
};

export default createRunOncePlugin(trustUserCAs, "trust-user-cas", "1.0.0");
