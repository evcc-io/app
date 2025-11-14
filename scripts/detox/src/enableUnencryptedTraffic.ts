import assert from "assert";
import {
  AndroidConfig,
  ConfigPlugin,
  withAndroidManifest,
  withDangerousMod,
} from "expo/config-plugins";
import path from "path";
import fs from "fs";

export type SubdomainsType = string[] | "*";

const enableUnencryptedTraffic: ConfigPlugin<{
  subdomains: SubdomainsType;
}> = (config, { subdomains }) => {
  return withNetworkSecurityConfigManifest(
    withNetworkSecurityConfigFile(config, { subdomains }),
  );
};

function getTemplateConfigContent(subdomains: SubdomainsType) {
  if (subdomains === "*") {
    // allow all domains
    return '<base-config cleartextTrafficPermitted="true" />';
  }
  return `<domain-config cleartextTrafficPermitted="true">
    ${subdomains
      .map(
        (subdomain) =>
          `<domain includeSubdomains="true">${subdomain}</domain>`,
      )
      .join("\n    ")}
  </domain-config>`;
}

export function getTemplateFile(subdomains: SubdomainsType): string {
  /**
   * May not have new lines or spaces in the beginning.
   * Otherwise build fails with:
   * "AAPT: error: XML or text declaration not at start of entity"
   */
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  ${getTemplateConfigContent(subdomains)}
</network-security-config>
`;
}

const withNetworkSecurityConfigFile: ConfigPlugin<{
  subdomains: SubdomainsType;
}> = (config, { subdomains }) => {
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
        getTemplateFile(subdomains),
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
