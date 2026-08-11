import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Host, Button as NativeButton, Text as NativeText } from "@expo/ui";
import {
  controlSize,
  frame,
  scaleEffect,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { radius, useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

// spinner sits next to the label so the button keeps its width while loading
function IosLoadingLabel({ color, label }: { color?: string; label: string }) {
  const { HStack, ProgressView } =
    require("@expo/ui/swift-ui") as typeof import("@expo/ui/swift-ui");
  return (
    <HStack spacing={14} modifiers={[frame({ maxWidth: 100000 })]}>
      {/* frame caps layout size so the button keeps its height; scaleEffect
          shrinks the drawing to match the text */}
      <ProgressView
        modifiers={[
          scaleEffect(0.75),
          frame({ width: 18, height: 18 }),
          ...(color ? [tint(color)] : []),
        ]}
      />
      <NativeText
        textStyle={{
          fontSize: 17,
          fontFamily: "Montserrat-Bold",
          ...(color ? { color } : {}),
        }}
      >
        {label}
      </NativeText>
    </HStack>
  );
}

export type ButtonVariant = "filled" | "outline";
export type ButtonStatus = "primary" | "basic";

interface ButtonProps {
  children: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  status?: ButtonStatus;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export default function Button({
  children,
  onPress,
  variant = "filled",
  status = "primary",
  disabled,
  loading,
  style,
  testID,
}: ButtonProps) {
  const colors = useThemeColors();
  const seed = status === "primary" ? colors.primary : colors.textHint;
  // like the web UI: dark label on the bright dark-mode green
  const filledLabelColor = colors.onPrimary;

  // Plain RN button path:
  // - outline always: SwiftUI/Compose have no true outline style
  // - Android always: Material re-tints the brand green and ignores label
  //   font weight, so exact styling needs RN
  // - everything under Detox, whose synthesized touches don't activate
  //   SwiftUI buttons
  if (
    variant === "outline" ||
    Platform.OS === "android" ||
    testingEnvironment()
  ) {
    const labelColor = variant === "filled" ? filledLabelColor : seed;
    return (
      <Pressable
        style={({ pressed }) => [
          {
            minHeight: 56,
            borderRadius: radius.pill,
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 16,
            backgroundColor: variant === "filled" ? seed : "transparent",
            borderWidth: variant === "outline" ? 2 : 0,
            borderColor: seed,
            opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
          },
          style,
        ]}
        disabled={disabled || loading}
        onPress={onPress}
        testID={testID}
      >
        {loading ? <ActivityIndicator size="small" color={labelColor} /> : null}
        <Text
          style={{
            fontSize: 17,
            fontFamily: "Montserrat-Bold",
            color: labelColor,
          }}
        >
          {children}
        </Text>
      </Pressable>
    );
  }

  return (
    // testID lives on the RN wrapper: Detox synthesized taps don't reach
    // SwiftUI views matched by their own identifier, but a tap on the
    // wrapper falls through native hit-testing onto the button
    <View style={style} testID={testID}>
      <Host matchContents={{ vertical: true }} seedColor={seed}>
        <NativeButton
          variant="filled"
          onPress={onPress}
          disabled={disabled || loading}
          modifiers={[controlSize("large")]}
        >
          {loading ? (
            <IosLoadingLabel
              color={variant === "filled" ? filledLabelColor : undefined}
              label={children}
            />
          ) : (
            <NativeText
              // stretch the label so the filled background spans full width
              modifiers={[frame({ maxWidth: 100000 })]}
              textStyle={{
                fontSize: 17,
                fontFamily: "Montserrat-Bold",
                color: filledLabelColor,
              }}
            >
              {children}
            </NativeText>
          )}
        </NativeButton>
      </Host>
    </View>
  );
}
