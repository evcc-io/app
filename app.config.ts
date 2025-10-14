import "tsx/cjs";
import { AppJSONConfig, ConfigContext } from "expo/config";
import { SCHEME } from "utils/constants";

export default ({ config }: ConfigContext) =>
  ({
    ...config,
    expo: {
      name: "evcc",
      slug: "evcc",
      scheme: SCHEME,
      description: "open source solar charging",
      version: "1.1.1",
      orientation: "default",
      icon: "./assets/icon-light.png",
      userInterfaceStyle: "automatic",
      assetBundlePatterns: ["**/*"],
      ios: {
        jsEngine: "jsc",
        supportsTablet: true,
        icon: "./assets/icon-liquid.icon",
        bundleIdentifier: "io.evcc.ios",
        infoPlist: {
          CFBundleLocalizations: ["de"],
          CFBundleDevelopmentRegion: "de",
          CFBundleAllowMixedLocalizations: true,
          NSLocalNetworkUsageDescription:
            "Die App benötigt Zugriff auf das lokale Netzwerk, um deine evcc Instanz zu finden.",
          NSAppTransportSecurity: {
            NSAllowsArbitraryLoads: true,
          },
          NSBonjourServices: ["_http._tcp.", "_https._tcp."],
        },
        config: {
          usesNonExemptEncryption: false,
        },
        buildNumber: "34",
      },
      android: {
        jsEngine: "hermes",
        permissions: [
          "android.permission.ACCESS_NETWORK_STATE",
          "android.permission.ACCESS_WIFI_STATE",
          "android.permission.CHANGE_WIFI_MULTICAST_STATE",
        ],
        package: "io.evcc.android",
        adaptiveIcon: {
          foregroundImage: "./assets/adaptive-icon.png",
          backgroundColor: "#010322",
        },
        versionCode: 34,
      },
      web: {
        favicon: "./assets/favicon.png",
        build: {
          babel: {
            include: ["@ui-kitten/components"],
          },
        },
      },
      plugins: [
        ["./scripts/fdroid/removeDKBuildId.ts"],
        ["./scripts/fdroid/disableDependencyMetadata.ts"],
        ["./scripts/fdroid/excludeNonfreeDependencies.ts"],
        [
          "expo-build-properties",
          {
            android: {
              usesCleartextTraffic: true,
            },
          },
        ],
        [
          "expo-font",
          {
            fonts: [
              "./assets/fonts/Montserrat-Bold.ttf",
              "./assets/fonts/Montserrat-Medium.ttf",
            ],
          },
        ],
        [
          "expo-splash-screen",
          {
            image: "./assets/splash-icon-light.png",
            backgroundColor: "#0FDE41",
            resizeMode: "contain",
            dark: {
              image: "./assets/splash-icon-dark.png",
              backgroundColor: "#010322",
            },
          },
        ],
        "expo-localization",
        "expo-web-browser",
        "react-native-edge-to-edge",
      ],
      extra: {
        eas: {
          projectId: "b1b49826-1d85-42bf-997f-653600e16c51",
        },
      },
      owner: "evcc-io",
    },
  }) satisfies AppJSONConfig;
