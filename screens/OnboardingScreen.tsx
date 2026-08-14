import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useAppContext } from "../components/AppContext";
import AppText from "components/AppText";
import Button from "components/Button";
import TextLink from "components/TextLink";
import { useThemeColors } from "utils/theme";
import { fetchOrGetTitle, verifyEvccServer } from "../utils/server";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Server } from "types";
import ScanQRCodeButton from "components/ScanQRCodeButton";
import StatusCircle from "components/StatusCircle";

// the evcc logo bolt (assets/icon-trans-light.svg), recolorable
function EvccBolt({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Path
        fill={color}
        d="M495.562,140.165l192.397,-0c6.932,-0 13.369,3.589 17.013,9.485c3.644,5.896 3.976,13.259 0.876,19.459l-113.793,227.585l95.904,-0c7.036,-0 13.554,3.697 17.165,9.735c3.611,6.038 3.784,13.529 0.455,19.727l-241.013,448.797c-4.605,8.574 -14.713,12.589 -23.945,9.512c-9.233,-3.078 -14.91,-12.355 -13.449,-21.977l45.124,-297.142l-137.065,0c-6.686,0 -12.929,-3.34 -16.639,-8.903c-3.709,-5.562 -4.394,-12.61 -1.825,-18.782l160.331,-385.182c3.104,-7.457 10.387,-12.314 18.464,-12.314Z"
      />
    </Svg>
  );
}

export default function OnboardingScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { addServer, setActiveServer } = useAppContext();

  const selectDemoServer = useCallback(async () => {
    const server = { url: "https://demo.evcc.io/", basicAuth: {} } as Server;
    server.title = await fetchOrGetTitle(server);
    try {
      const finalUrl = await verifyEvccServer(server);
      const verifiedServer = { ...server, url: finalUrl };
      await addServer(verifiedServer);
      await setActiveServer(verifiedServer);
    } catch (error) {
      Alert.alert((error as Error).message);
    }
  }, [addServer, setActiveServer]);

  const startSearch = useCallback(() => {
    navigation.navigate("SearchServer");
  }, [navigation]);

  const manualEntry = useCallback(() => {
    navigation.navigate("AddServer");
  }, [navigation]);

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 24,
        backgroundColor: colors.background,
      }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <StatusCircle color={colors.primaryTint}>
            <EvccBolt size={88} color={colors.onPrimaryTint} />
          </StatusCircle>
          <AppText
            testID="serverScreenTitle"
            variant="h2"
            style={{ textAlign: "center" }}
          >
            {t("main.title")}
          </AppText>
          <AppText
            color="hint"
            style={{
              fontSize: 17,
              lineHeight: 25,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {t("main.description")}
          </AppText>
        </View>
        <View style={{ paddingBottom: 8, gap: 12 }}>
          <Button onPress={startSearch} testID="serverSearchButton">
            {t("servers.search.start")}
          </Button>
          <ScanQRCodeButton shown="Onboarding" />
          <TextLink onPress={manualEntry} testID="manualEntry">
            {t("servers.manually.specify")}
          </TextLink>
          <TextLink onPress={selectDemoServer} testID="useDemo">
            {t("servers.useDemo")}
          </TextLink>
        </View>
      </SafeAreaView>
    </View>
  );
}
