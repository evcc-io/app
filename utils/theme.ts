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

// evcc light/dark palette, values carried over from the former UI Kitten theme
const palette: Record<"light" | "dark", ThemeColors> = {
  light: {
    text: "#222B45",
    textHint: "#8F9BB3",
    background: "#FFFFFF",
    surface: "#F7F9FC",
    border: "#C5CEE0",
    primary: "#0BA631",
    onPrimary: "#FFFFFF",
    primaryTint: "#BAFFCB",
    onPrimaryTint: "#076F20",
    danger: "#FC440F",
  },
  dark: {
    text: "#FFFFFF",
    textHint: "#8F9BB3",
    background: "#28293E",
    surface: "#33344E",
    border: "#8F9BB3",
    primary: "#0FDE41",
    onPrimary: "#010322",
    primaryTint: "rgba(15, 222, 65, 0.15)",
    onPrimaryTint: "#0FDE41",
    danger: "#FC440F",
  },
};

export function useAppColorScheme(): "light" | "dark" {
  return useColorScheme() === "dark" ? "dark" : "light";
}

export function useThemeColors(): ThemeColors {
  return palette[useAppColorScheme()];
}
