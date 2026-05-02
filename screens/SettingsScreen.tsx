import React from "react";
import { Layout, Button, Text } from "@ui-kitten/components";
import { View, TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";
import ServerForm from "../components/ServerForm";
import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";
import { useTranslation } from "react-i18next";
import { APP_VERSION, GITHUB_RELEASES_URL } from "../utils/constants";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Server } from "types";
import { SafeAreaView } from "react-native-safe-area-context";
import { sameServer } from "utils/server";

function SettingsScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const { t } = useTranslation();
  const { activeServer, updateServer, removeServer, servers, setActiveServer } =
    useAppContext();
  const { server: internalServer, serverIndex } = route.params || {};

  const saveServer = React.useCallback(
    async (server: Server) => {
      if (serverIndex !== undefined) {
        if (
          activeServer &&
          servers.findIndex((s) => sameServer(activeServer, s)) === serverIndex
        ) {
          await setActiveServer(server);
        }
        await updateServer(server, serverIndex);
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, updateServer],
  );

  const serverForm = React.useMemo(
    () => (
      <ServerForm
        mode="update"
        server={internalServer}
        serverSelected={saveServer}
      />
    ),
    [internalServer, saveServer],
  );

  const openGitHubReleases = () => {
    Linking.openURL(GITHUB_RELEASES_URL);
  };

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Header
          title={t("servers.changeServer")}
          showDone
          onDone={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }}
        />
        <View style={{ paddingHorizontal: 16 }}>
          {serverForm}

          <Button
            testID="setingsScreenRemoveServer"
            style={{ marginVertical: 16 }}
            appearance="ghost"
            status="danger"
            onPress={async () => {
              if (serverIndex !== undefined) {
                if (servers.length > 1) {
                  navigation.navigate("ChangeServer");
                }
                await removeServer(serverIndex);
              }
            }}
          >
            {t("servers.removeServer")}
          </Button>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "flex-end",
            alignItems: "center",
            paddingBottom: 8,
          }}
        >
          <TouchableOpacity onPress={openGitHubReleases}>
            <Text appearance="hint" category="c1">
              {APP_VERSION}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Layout>
  );
}

export default React.memo(SettingsScreen);
