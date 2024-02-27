import React from "react";
import { Text, Icon } from "@ui-kitten/components";
import { View, Pressable } from "react-native";
import { useTheme } from "@ui-kitten/components";

export function CloseIcon(props) {
  const theme = useTheme();

  return (
    <Icon
      name="close-outline"
      height={32}
      width={32}
      fill={theme["text-basic-color"]}
      {...props}
    />
  );
}

interface HeaderProps {
  title: string;
  showDone?: boolean;
  onDone?: () => void;
}

export default function Header({ title, showDone, onDone }: HeaderProps) {
  return (
    <View
      style={{
        marginVertical: 32,
        flexDirection: "row",
      }}
    >
      <Text category="h3" style={{ flex: 1, paddingLeft: 16 }}>
        {title}
      </Text>
      {showDone && (
        <Pressable
          onPress={onDone}
          style={{ paddingHorizontal: 16, paddingVertical: 4 }}
        >
          <CloseIcon />
        </Pressable>
      )}
    </View>
  );
}
