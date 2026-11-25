import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import type { ExpoConfig } from "expo/config";
import type { Envs } from "utils/envs";

const mode = process.argv[2];
assert(mode === "defaults" || mode === "branded");

const require = createRequire(import.meta.url);
const config: ExpoConfig = JSON.parse(
  execFileSync(
    process.execPath,
    [require.resolve("expo/bin/cli"), "config", "--type", "public", "--json"],
    { encoding: "utf8", env: { ...process.env, EXPO_NO_DOTENV: "1" } },
  ),
);
const plugins = Object.fromEntries(
  (config.plugins ?? []).flatMap((plugin) =>
    Array.isArray(plugin) && plugin.length === 2 ? [plugin] : [],
  ),
);
const fonts = plugins["expo-font"].fonts;
const splash = plugins["expo-splash-screen"];

// Each entry pairs the resolved Expo value with its evcc default
const checks = {
  EVCC_APP_CUSTOM_NAME: [config.name, "evcc"],
  EVCC_APP_CUSTOM_LOGO_LIGHT: [config.icon, "./assets/icon-light.png"],
  EVCC_APP_CUSTOM_IOS_BUNDLE_IDENTIFIER: [
    config.ios?.bundleIdentifier,
    "io.evcc.ios",
  ],
  EVCC_APP_CUSTOM_IOS_APPLE_TEAM_ID: [config.ios?.appleTeamId, "UX3KG7U4Y6"],
  EVCC_APP_CUSTOM_ANDROID_PACKAGE: [config.android?.package, "io.evcc.android"],
  EVCC_APP_CUSTOM_ANDROID_ADAPTIVE_ICON: [
    config.android?.adaptiveIcon?.foregroundImage,
    "./assets/adaptive-icon.png",
  ],
  EVCC_APP_CUSTOM_ANDROID_ADAPTIVE_ICON_BACKGROUND_COLOR: [
    config.android?.adaptiveIcon?.backgroundColor,
    "#010322",
  ],
  EVCC_APP_CUSTOM_WEB_FAVICON: [config.web?.favicon, "./assets/favicon.png"],
  EVCC_APP_CUSTOM_ONBOARDING_ICON: [
    config.extra?.["onboardingIconSvg"],
    undefined,
  ],
  EVCC_APP_CUSTOM_FONT_BOLD: [fonts[0], "./assets/fonts/Montserrat-Bold.ttf"],
  EVCC_APP_CUSTOM_FONT_MEDIUM: [
    fonts[1],
    "./assets/fonts/Montserrat-Medium.ttf",
  ],
  EVCC_APP_CUSTOM_THEME_PRIMARY_LIGHT: [
    config.extra?.["themePrimaryLight"],
    undefined,
  ],
  EVCC_APP_CUSTOM_THEME_PRIMARY_DARK: [
    config.extra?.["themePrimaryDark"],
    undefined,
  ],
  EVCC_APP_CUSTOM_SPLASH_IMAGE_LIGHT: [
    splash.image,
    "./assets/splash-icon-light.png",
  ],
  EVCC_APP_CUSTOM_SPLASH_IMAGE_DARK: [
    splash.dark.image,
    "./assets/splash-icon-dark.png",
  ],
  EVCC_APP_CUSTOM_SPLASH_BACKGROUND_COLOR_LIGHT: [
    splash.backgroundColor,
    "#0FDE41",
  ],
  EVCC_APP_CUSTOM_SPLASH_BACKGROUND_COLOR_DARK: [
    splash.dark.backgroundColor,
    "#010322",
  ],
} satisfies Record<Envs, [unknown, string | undefined]>;

for (const [key, [actual, fallback]] of Object.entries(checks)) {
  const override = process.env[key];
  if (mode === "defaults") {
    assert.equal(override, undefined, `Unset ${key} to check defaults`);
    assert.equal(actual, fallback, key);
  } else {
    assert.ok(override, `Missing ${key} from the test profile`);
    // Expo embeds the SVG contents rather than its path
    const expected =
      key === "EVCC_APP_CUSTOM_ONBOARDING_ICON"
        ? readFileSync(override, "utf8")
        : override;
    assert.equal(actual, expected, key);
  }
}

console.log(
  `White-label Expo config (${mode}): ${Object.keys(checks).length} variables checked`,
);
