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
import { RootStackParamList, BasicAuth } from "types";

function SettingsScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Settings">) {
  const { t } = useTranslation();
  const { serverUrl, basicAuth, updateServerUrl } = useAppContext();

  const saveServer = React.useCallback(
    (url: string, basicAuth: BasicAuth) => {
      updateServerUrl(url, basicAuth);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
    [navigation, updateServerUrl],
  );

  const serverForm = React.useMemo(
    () => (
      <ServerForm
        url={serverUrl}
        basicAuth={basicAuth}
        serverSelected={saveServer}
      />
    ),
    [serverUrl, basicAuth, saveServer],
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
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => {
            navigation.goBack();
            updateServerUrl("", { required: false });
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
