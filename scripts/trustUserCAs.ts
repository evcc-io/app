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

const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';
const USER_CA_XML_PARENT_TAG = 'network-security-config';
const USER_CA_CONFIG_XML = `
    <base-config>
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
`;

const withNetworkSecurityConfigFile: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resXmlPath = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      const filePath = path.join(resXmlPath, NETWORK_SECURITY_CONFIG_FILE);

      if (fs.existsSync(filePath)) {
        const existing = fs.readFileSync(filePath, "utf-8");
        if (existing.includes('certificates src="user"')) return config;

        const merged = existing.replace(
          `</${USER_CA_XML_PARENT_TAG}>`,
          `${USER_CA_CONFIG_XML}</${USER_CA_XML_PARENT_TAG}>`
        );
        fs.writeFileSync(filePath, merged, "utf-8");
      } else {
        fs.mkdirSync(resXmlPath, { recursive: true });
        fs.writeFileSync(
          filePath,
          `${XML_HEADER}<${USER_CA_XML_PARENT_TAG}>${USER_CA_CONFIG_XML}</${USER_CA_XML_PARENT_TAG}>`,
          "utf-8",
        );
      }

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

export default createRunOncePlugin(
  trustUserCAs,
  "trust-user-cas",
  "1.0.0",
);
