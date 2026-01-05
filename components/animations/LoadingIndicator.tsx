import { View } from "react-native";
import { SpinnerProps } from "@ui-kitten/components";
import Spinner from "./Spinner";

export default function LoadingIndicator(props?: SpinnerProps) {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Spinner {...props} />
    </View>
  );
}
