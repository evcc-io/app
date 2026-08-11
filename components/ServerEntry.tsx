import React from "react";
import { Pressable, View } from "react-native";
import AppText from "components/AppText";
import { useThemeColors } from "utils/theme";

export const SERVER_ENTRY_MIN_HEIGHT = 72;

interface ServerEntryProps {
  title?: string;
  url?: string;
  leftIcon: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  onRightPress?: () => void;
  testID?: string;
}

// plain row — the parent list decides the card chrome (background, radius);
// leftIcon is rendered inside the standard 44px circle
export default function ServerEntry({
  title,
  url,
  leftIcon,
  rightIcon,
  onPress,
  onRightPress,
  testID,
}: ServerEntryProps) {
  const colors = useThemeColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        minHeight: SERVER_ENTRY_MIN_HEIGHT,
      }}
      testID={testID}
    >
      <Pressable
        onPress={onPress}
        accessibilityLabel={title}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          {leftIcon}
        </View>
        <View style={{ flex: 1 }}>
          {title ? <AppText variant="s1">{title}</AppText> : null}
          {url ? (
            <AppText variant="c1" color="hint" numberOfLines={1}>
              {url}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {rightIcon ? (
        <Pressable
          onPress={onRightPress ?? onPress}
          style={{
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {rightIcon}
        </Pressable>
      ) : null}
    </View>
  );
}
