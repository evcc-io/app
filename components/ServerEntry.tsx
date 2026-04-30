import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "@ui-kitten/components";

export const SERVER_ENTRY_MIN_HEIGHT = 72;

interface ServerEntryProps {
  title?: string;
  url?: string;
  active?: boolean;
  leftIcon: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  onRightPress?: () => void;
  testID?: string;
  selectTestID?: string;
}

export default function ServerEntry({
  title,
  url,
  active = false,
  leftIcon,
  rightIcon,
  onPress,
  onRightPress,
  testID,
  selectTestID,
}: ServerEntryProps) {
  const theme = useTheme();
  const accentColor = active
    ? theme["text-primary-color"]
    : theme["text-basic-color"];
  const textStyle = active ? { color: accentColor } : undefined;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "stretch",
        borderColor: accentColor,
        borderWidth: 1,
        borderRadius: 16,
        overflow: "hidden",
        minHeight: SERVER_ENTRY_MIN_HEIGHT,
      }}
      testID={testID}
    >
      <TouchableOpacity
        onPress={onPress}
        testID={selectTestID}
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ marginRight: 16 }}>{leftIcon}</View>
        <View style={{ flex: 1 }}>
          {title ? (
            <Text category="s1" style={textStyle}>
              {title}
            </Text>
          ) : null}
          {url ? (
            <Text
              category="c1"
              appearance={active ? "default" : "hint"}
              style={textStyle}
            >
              {url}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
      {rightIcon ? (
        <TouchableOpacity
          onPress={onRightPress ?? onPress}
          style={{
            paddingHorizontal: 20,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {rightIcon}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
