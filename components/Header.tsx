import { View, Pressable } from "react-native";
import IconClose from "@material-symbols/svg-400/rounded/close.svg";
import IconBack from "@material-symbols/svg-400/rounded/arrow_back_ios_new.svg";
import AppText from "components/AppText";
import { useAppColorScheme, useThemeColors } from "utils/theme";

// round dismiss bubble, like native iOS sheets
export function CloseIcon({ testID = "headerCloseIcon" }: { testID?: string }) {
  const colors = useThemeColors();
  const scheme = useAppColorScheme();
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          scheme === "dark" ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
      }}
    >
      <IconClose width={20} height={20} fill={colors.textHint} testID={testID} />
    </View>
  );
}

export function BackIcon() {
  const colors = useThemeColors();
  return (
    <IconBack
      width={28}
      height={28}
      fill={colors.text}
      testID="headerBackIcon"
    />
  );
}

interface HeaderProps {
  title: string;
  showDone?: boolean;
  onDone?: () => void;
  doneTestID?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function Header({
  title,
  showDone,
  onDone,
  doneTestID,
  showBack,
  onBack,
}: HeaderProps) {
  return (
    <View
      style={{
        marginVertical: 16,
        height: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <View
        pointerEvents="none"
        style={{ position: "absolute", left: 64, right: 64, alignItems: "center" }}
      >
        <AppText
          variant="s1"
          numberOfLines={1}
          style={{ fontSize: 17 }}
        >
          {title}
        </AppText>
      </View>
      <View>
        {showBack ? (
          <Pressable
            onPress={onBack}
            style={{ paddingHorizontal: 16, paddingVertical: 4 }}
          >
            <BackIcon />
          </Pressable>
        ) : null}
      </View>
      <View>
        {showDone ? (
          <Pressable
            onPress={onDone}
            style={{ paddingHorizontal: 16, paddingVertical: 4 }}
          >
            <CloseIcon testID={doneTestID} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
