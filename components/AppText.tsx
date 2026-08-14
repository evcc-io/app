import { Text, TextProps, TextStyle } from "react-native";
import { useThemeColors } from "utils/theme";

type Variant = "h2" | "h3" | "body" | "s1" | "c1";
type Color = "default" | "hint" | "danger" | "success";

// fontFamily selects the embedded cut — no fontWeight, Android would fake-bold on top
const variants: Record<Variant, TextStyle> = {
  h2: { fontSize: 34, fontFamily: "Montserrat-Bold" },
  h3: { fontSize: 26, fontFamily: "Montserrat-Bold" },
  body: { fontSize: 15, fontFamily: "Montserrat-Medium", lineHeight: 22 },
  s1: { fontSize: 15, fontFamily: "Montserrat-Bold" },
  c1: { fontSize: 12, fontFamily: "Montserrat-Medium" },
};

interface AppTextProps extends TextProps {
  variant?: Variant;
  color?: Color;
}

export default function AppText({
  variant = "body",
  color = "default",
  style,
  ...props
}: AppTextProps) {
  const colors = useThemeColors();
  const colorValue = {
    default: colors.text,
    hint: colors.textHint,
    danger: colors.danger,
    success: colors.primary,
  }[color];
  return (
    <Text
      {...props}
      style={[variants[variant], { color: colorValue }, style]}
    />
  );
}
