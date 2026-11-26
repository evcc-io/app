import { useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert, ScrollView, View } from "react-native";
import Constants from "expo-constants";
import { SvgXml } from "react-native-svg";
import DefaultOnboardingIcon from "assets/icon-trans-light.svg";

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


export default function OnboardingScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const onboardingIconSvg: unknown =
    Constants.expoConfig?.extra?.["onboardingIconSvg"];
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
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            width: "100%",
            maxWidth: 480,
            alignSelf: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <StatusCircle color={colors.primaryTint}>
              {typeof onboardingIconSvg === "string" ? (
                <SvgXml xml={onboardingIconSvg} width={88} height={88} fill={colors.onPrimaryTint} />
              ) : (
                <DefaultOnboardingIcon width={88} height={88} fill={colors.onPrimaryTint} />
              )}
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
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
