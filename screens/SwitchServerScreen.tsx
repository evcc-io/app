import * as Linking from "expo-linking";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { useAppContext } from "../components/AppContext";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Server, SwitchServerStackParamList } from "types";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { TouchableOpacity, View } from "react-native";
import { delay } from "utils/delay";
import { APP_VERSION, GITHUB_RELEASES_URL } from "../utils/constants";
import Header from "components/Header";
import AppText from "components/AppText";
import SwitchServerList from "components/SwitchServerList";
import { useThemeColors } from "utils/theme";

export default function SwitchServerScreen({
  navigation,
}: NativeStackScreenProps<SwitchServerStackParamList, "SwitchServer">) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { setActiveServer } = useAppContext();

  const onSelect = useCallback(
    async (server: Server) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await setActiveServer(server);
      await delay(500);
      navigation.goBack();
    },
    [setActiveServer, navigation],
  );

  const onEdit = useCallback(
    (server: Server, serverIndex: number) => {
      navigation.navigate("EditServer", { server, serverIndex });
    },
    [navigation],
  );

  const onAdd = useCallback(() => {
    navigation.navigate("AddServer");
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.switchServer.title")}
          showDone
          onDone={() => {
            navigation.getParent()?.goBack();
          }}
        />
        <SwitchServerList onSelect={onSelect} onEdit={onEdit} onAdd={onAdd} />
        <View
          style={{
            alignItems: "center",
            paddingTop: 8,
            // modal sheets don't reliably propagate the bottom inset to SafeAreaView
            paddingBottom: Math.max(insets.bottom, 8),
          }}
        >
          <TouchableOpacity
            onPress={() => Linking.openURL(GITHUB_RELEASES_URL)}
          >
            <AppText color="hint" variant="c1">
              {APP_VERSION}
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
