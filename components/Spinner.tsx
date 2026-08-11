import { Platform, View } from "react-native";
import { size } from "@expo/ui/jetpack-compose/modifiers";
import { useThemeColors } from "utils/theme";
import { testingEnvironment } from "helper/launchArguments";

// OS-native indeterminate spinner: Material 3 LoadingIndicator on Android,
// SwiftUI ProgressView on iOS. Static under Detox so the idle-sync doesn't hang.
export default function Spinner() {
  const colors = useThemeColors();

  if (testingEnvironment()) {
    return <View style={{ width: 48, height: 48 }} />;
  }

  if (Platform.OS === "android") {
    const { Host, LoadingIndicator } =
      require("@expo/ui/jetpack-compose") as typeof import("@expo/ui/jetpack-compose");
    return (
      <Host matchContents>
        <LoadingIndicator
          color={colors.primary}
          modifiers={[size(48, 48)]}
        />
      </Host>
    );
  }

  const { Host, ProgressView } =
    require("@expo/ui/swift-ui") as typeof import("@expo/ui/swift-ui");
  return (
    <Host matchContents>
      <ProgressView />
    </Host>
  );
}
