import React from "react";
import { Text, useTheme } from "@ui-kitten/components";
import { View, Pressable } from "react-native";
import IconClose from "@material-symbols/svg-400/rounded/close.svg";

export function CloseIcon() {
  const theme = useTheme();
  return (
    <IconClose
      width={32}
      height={32}
      fill={theme["text-basic-color"]}
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
