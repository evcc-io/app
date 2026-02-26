import { ImageProps, ImageStyle, StyleSheet, View } from "react-native";
import Spinner from "./Spinner";

export default function LoadingIndicator(props: Partial<ImageProps> = {}) {
  const color = (StyleSheet.flatten(props.style) as ImageStyle)?.tintColor;
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Spinner size="small" status="control" style={color ? { borderColor: color } : undefined} />
    </View>
  );
}
