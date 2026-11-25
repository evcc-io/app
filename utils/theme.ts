import Constants from "expo-constants";
import { useColorScheme } from "react-native";

export interface ThemeColors {
  text: string;
  textHint: string;
  background: string;
  surface: string;
  border: string;
  primary: string;
  // label color on primary-filled surfaces (dark text on the bright dark-mode green)
  onPrimary: string;
  // soft brand-green fill for hero/status circles, with its icon color
  primaryTint: string;
  onPrimaryTint: string;
  danger: string;
}

export const radius = {
  card: 16,
  pill: 999,
} as const;

function primaryColor(value: unknown, fallback: string): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toUpperCase()
    : fallback;
}

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)) as [number, number, number];
}

function mix(hex: string, target: number, amounts: [number, number, number]): string {
  const channels = rgb(hex).map((channel, i) =>
    Math.round(channel + (target - channel) * amounts[i]).toString(16).padStart(2, "0"),
  );
  return `#${channels.join("").toUpperCase()}`;
}

const extra = Constants.expoConfig?.extra;
const lightPrimary = primaryColor(extra?.["themePrimaryLight"], "#0BA631");
const darkPrimary = primaryColor(extra?.["themePrimaryDark"], "#0FDE41");

// RGB mix fractions calibrated to reproduce the original evcc Light colors
const circleMix: [number, number, number] = [175 / 244, 1, 77 / 103];
const symbolMix: [number, number, number] = [4 / 11, 55 / 166, 17 / 49];

// evcc light/dark palette, values carried over from the former UI Kitten theme
const palette: Record<"light" | "dark", ThemeColors> = {
  light: {
    text: "#222B45",
    textHint: "#8F9BB3",
    background: "#FFFFFF",
    surface: "#F7F9FC",
    border: "#C5CEE0",
    primary: lightPrimary,
    onPrimary: "#FFFFFF",
    primaryTint: mix(lightPrimary, 255, circleMix),
    onPrimaryTint: mix(lightPrimary, 0, symbolMix),
    danger: "#FC440F",
  },
  dark: {
    text: "#FFFFFF",
    textHint: "#8F9BB3",
    background: "#28293E",
    surface: "#33344E",
    border: "#8F9BB3",
    primary: darkPrimary,
    onPrimary: "#010322",
    primaryTint: `rgba(${rgb(darkPrimary).join(", ")}, 0.15)`,
    onPrimaryTint: darkPrimary,
    danger: "#FC440F",
  },
};

export function useAppColorScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useThemeColors(): ThemeColors {
  return palette[useAppColorScheme()];
}
