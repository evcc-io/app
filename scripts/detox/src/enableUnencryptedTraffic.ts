import assert from "assert";
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";
import path from "path";
import fs from "fs";

const enableUnencryptedTraffic: ConfigPlugin = (config) => {
  return withNetworkSecurityConfigManifest(
    withNetworkSecurityConfigFile(config),
  );
};

const networkSecurityConfigContent = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">localhost</domain>
    </domain-config>
</network-security-config>`;

const withNetworkSecurityConfigFile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const packageName = config.android?.package;
      assert(packageName, "android.package must be defined");
      const folder = path.join(
        config.modRequest.platformProjectRoot,
        `app/src/main/res/xml`,
      );
      fs.mkdirSync(folder, { recursive: true });
      fs.writeFileSync(
        path.join(folder, "network_security_config.xml"),
        networkSecurityConfigContent,
        { encoding: "utf8" },
      );
      return config;
    },
  ]);
};

export const withNetworkSecurityConfigManifest: ConfigPlugin = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    application.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";
    return config;
  });
};

export default enableUnencryptedTraffic;
