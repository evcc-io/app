import Constants from "expo-constants";

const configured = Constants.expoConfig?.extra?.["fontFamilies"] as
  | { bold?: string; medium?: string }
  | undefined;

export const fontFamilies = {
  bold: configured?.bold ?? "Montserrat-Bold",
  medium: configured?.medium ?? "Montserrat-Medium",
};