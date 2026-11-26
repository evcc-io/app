import React from "react";
import { View } from "react-native";
import { radius, useThemeColors } from "utils/theme";

// shared card chrome for server rows (switch list, search results)
export default function ServerCard({
  selected = false,
  testID,
  children,
}: {
  selected?: boolean;
  testID?: string;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: colors.surface,
        borderRadius: radius.card,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: selected ? colors.primary : "transparent",
      }}
    >
      {children}
    </View>
  );
}
