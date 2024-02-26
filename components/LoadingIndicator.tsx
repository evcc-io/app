import { View } from "react-native";
import { Spinner } from "@ui-kitten/components";

export default function LoadingIndicator() {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Spinner status="control" size="small" />
    </View>
  );
}
