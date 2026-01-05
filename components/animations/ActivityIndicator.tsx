import { ActivityIndicatorProps, View } from "react-native";
import { ActivityIndicator as RNActivityIndicator } from "react-native";
import { disableAnimations } from "helper/launchArguments";

export default function ActivityIndicator(props?: ActivityIndicatorProps) {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <RNActivityIndicator {...props} animating={!disableAnimations()} />
    </View>
  );
}
