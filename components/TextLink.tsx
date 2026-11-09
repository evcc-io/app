import { Pressable, StyleProp, ViewStyle } from "react-native";
import AppText from "components/AppText";

interface TextLinkProps {
  children: string;
  onPress: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
}

// tertiary action: underlined muted text with a >=44px tap target
export default function TextLink({
  children,
  onPress,
  testID,
  style,
}: TextLinkProps) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={[{ paddingVertical: 12, paddingHorizontal: 8 }, style]}
    >
      <AppText
        color="hint"
        // centered by textAlign, not shrink-wrapped: Android sometimes
        // measures short labels a bit too narrow and clips the last word
        style={{
          fontSize: 14,
          textDecorationLine: "underline",
          textAlign: "center",
        }}
      >
        {children}
      </AppText>
    </Pressable>
  );
}
