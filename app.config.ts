import "tsx/cjs";
import { readFileSync } from "node:fs";
import { parse, resolve } from "node:path";
import { AppJSONConfig, ConfigContext } from "expo/config";
import { SCHEME } from "utils/constants";
import { Envs, getEnv } from "utils/envs";

export default ({ config, projectRoot }: ConfigContext) => {
  const name = getEnv(Envs.EVCC_APP_CUSTOM_NAME, "evcc");
  const onboardingIcon = getEnv(Envs.EVCC_APP_CUSTOM_ONBOARDING_ICON);
  const fontBold = getEnv(
    Envs.EVCC_APP_CUSTOM_FONT_BOLD,
    "./assets/fonts/Montserrat-Bold.ttf",
  );
  const fontMedium = getEnv(
    Envs.EVCC_APP_CUSTOM_FONT_MEDIUM,
    "./assets/fonts/Montserrat-Medium.ttf",
  );

  return {
    ...config,
    expo: {
      name,
      slug: getEnv(Envs.EVCC_APP_CUSTOM_EXPO_SLUG, name),
      scheme: SCHEME,
      description: "smart charging",
      version: "1.7.1",
      orientation: "default",
      icon: getEnv(Envs.EVCC_APP_CUSTOM_LOGO_LIGHT, "./assets/icon-light.png"),
      userInterfaceStyle: "automatic",
      assetBundlePatterns: ["**/*"],
      ios: {
        supportsTablet: true,
        icon: "./assets/icon-liquid.icon",
        bundleIdentifier: getEnv(
          Envs.EVCC_APP_CUSTOM_IOS_BUNDLE_IDENTIFIER,
          "io.evcc.ios",
        ),
        appleTeamId: getEnv(
          Envs.EVCC_APP_CUSTOM_IOS_APPLE_TEAM_ID,
          "UX3KG7U4Y6",
        ),
        // Shared App Group: the app writes the server list here and the widget
        // extension reads it. `@bacons/apple-targets` auto-syncs this group to
        // the widget target on prebuild.
        entitlements: {
          "com.apple.security.application-groups": ["group.io.evcc.app"],
        },
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
        buildNumber: "53",
      },
      android: {
        permissions: [
          "android.permission.ACCESS_NETWORK_STATE",
          "android.permission.ACCESS_WIFI_STATE",
          "android.permission.CHANGE_WIFI_MULTICAST_STATE",
        ],
        package: getEnv(
          Envs.EVCC_APP_CUSTOM_ANDROID_PACKAGE,
          "io.evcc.android",
        ),
        adaptiveIcon: {
          foregroundImage: getEnv(
            Envs.EVCC_APP_CUSTOM_ANDROID_ADAPTIVE_ICON,
            "./assets/adaptive-icon.png",
          ),
          backgroundColor: getEnv(
            Envs.EVCC_APP_CUSTOM_ANDROID_ADAPTIVE_ICON_BACKGROUND_COLOR,
            "#010322",
          ),
        },
        versionCode: 53,
      },
      web: {
        favicon: getEnv(
          Envs.EVCC_APP_CUSTOM_WEB_FAVICON,
          "./assets/favicon.png",
        ),
      },
      plugins: [
        "@bacons/apple-targets",
        ["./scripts/androidWidget/withAndroidWidget.ts"],
        ["./scripts/fdroid/configureFdroid.ts"],
        [
          "./scripts/detox/configureDetox.ts",
          { subdomains: "*" }, // uncomment to debug app
        ],
        ["./scripts/trustUserCAs.ts"],
        ["./scripts/increaseGradleMemory.ts"],
        [
          "expo-build-properties",
          {
            android: {
              usesCleartextTraffic: true,
            },
            ios: {
              deploymentTarget: "16.4",
              // Xcode 27 SDK requires the UIScene lifecycle; template default from SDK 58
              enableSceneSupport: true,
            },
          },
        ],
        [
          "expo-camera",
          {
            cameraPermission:
              "Die App benötigt Zugriff auf die Kamera, um QR-Codes zur Servereinrichtung zu scannen.",
            microphonePermission: false,
            recordAudioAndroid: false,
          },
        ],
        [
          "expo-font",
          {
            fonts: [fontBold, fontMedium],
          },
        ],
        [
          "expo-splash-screen",
          {
            image: getEnv(
              Envs.EVCC_APP_CUSTOM_SPLASH_IMAGE_LIGHT,
              "./assets/splash-icon-light.png",
            ),
            backgroundColor: getEnv(
              Envs.EVCC_APP_CUSTOM_SPLASH_BACKGROUND_COLOR_LIGHT,
              "#0FDE41",
            ),
            resizeMode: "contain",
            dark: {
              image: getEnv(
                Envs.EVCC_APP_CUSTOM_SPLASH_IMAGE_DARK,
                "./assets/splash-icon-dark.png",
              ),
              backgroundColor: getEnv(
                Envs.EVCC_APP_CUSTOM_SPLASH_BACKGROUND_COLOR_DARK,
                "#010322",
              ),
            },
          },
        ],
        "expo-localization",
        "expo-sharing",
        "expo-status-bar",
        "expo-web-browser",
        "react-native-edge-to-edge",
      ],
      extra: {
        fontFamilies: { bold: parse(fontBold).name, medium: parse(fontMedium).name },
        themePrimaryLight: getEnv(Envs.EVCC_APP_CUSTOM_THEME_PRIMARY_LIGHT),
        themePrimaryDark: getEnv(Envs.EVCC_APP_CUSTOM_THEME_PRIMARY_DARK),
        ...(onboardingIcon && {
          onboardingIconSvg: readFileSync(resolve(projectRoot, onboardingIcon), "utf8"),
        }),
        eas: {
          projectId: getEnv(
            Envs.EVCC_APP_CUSTOM_EAS_PROJECT_ID,
            "b1b49826-1d85-42bf-997f-653600e16c51",
          ),
        },
      },
      owner: getEnv(Envs.EVCC_APP_CUSTOM_EXPO_OWNER, "evcc-io"),
    },
  } satisfies AppJSONConfig;
};
