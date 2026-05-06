import React from "react";
import { Text, useTheme } from "@ui-kitten/components";
import { View, Pressable } from "react-native";
import IconClose from "@material-symbols/svg-400/rounded/close.svg";
import IconBack from "@material-symbols/svg-400/rounded/arrow_back_ios_new.svg";

export function CloseIcon() {
  const theme = useTheme();
  return <IconClose width={32} height={32} fill={theme["text-basic-color"]} />;
}

export function BackIcon() {
  const theme = useTheme();
  return <IconBack width={28} height={28} fill={theme["text-basic-color"]} />;
}

interface HeaderProps {
  title: string;
  showDone?: boolean;
  onDone?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Header({
  title,
  showDone,
  onDone,
  showBack,
  onBack,
}: HeaderProps) {
  return (
    <View
      style={{
        marginVertical: 32,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {showBack && (
        <Pressable
          onPress={onBack}
          style={{ paddingHorizontal: 16, paddingVertical: 4 }}
        >
          <BackIcon />
        </Pressable>
      )}
      <Text category="h3" style={{ flex: 1, paddingLeft: showBack ? 0 : 16 }}>
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
