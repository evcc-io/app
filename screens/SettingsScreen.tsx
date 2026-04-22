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

function SettingsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const { t } = useTranslation();
  const { activeServer, updateServer, removeServer } = useAppContext();

  const saveServer = React.useCallback(
    (server: Server) => {
      updateServer(server);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, updateServer],
  );

  const serverForm = React.useMemo(
    () => <ServerForm server={activeServer} serverSelected={saveServer} />,
    [activeServer, saveServer],
  );

  const openGitHubReleases = () => {
    Linking.openURL(GITHUB_RELEASES_URL);
  };

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <Header
        title={t("servers.changeServer")}
        showDone
        onDone={() => navigation.goBack()}
      />
      <View style={{ paddingHorizontal: 16 }}>
        {serverForm}

        <Button
          testID="setingsScreenRemoveServer"
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => {
            navigation.goBack();
            removeServer(0);
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
    </Layout>
  );
}

export default React.memo(SettingsScreen);
