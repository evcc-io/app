import React from "react";
import { StyleProp, View, ViewStyle } from "react-native";

// the 132px hero/status circle used on onboarding and the search flow
export default function StatusCircle({
  color,
  children,
  style,
}: {
  color: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[
        {
          width: 132,
          height: 132,
          borderRadius: 66,
          backgroundColor: color,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
