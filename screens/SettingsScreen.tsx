import React from "react";
import { Layout, Button } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";

import { BasicAuth } from "../interfaces/basicAuth";
import { useTranslation } from "react-i18next";

function navigateToMain(navigation) {
  navigation.navigate("Main");
}

function SettingsScreen({ navigation }) {
  const { t } = useTranslation();
  const { serverUrl, basicAuth, updateServerUrl } = useAppContext();

  const saveServer = React.useCallback(
    (url, basicAuth: BasicAuth) => {
      updateServerUrl(url, basicAuth);
      navigateToMain(navigation);
    },
    [navigation, updateServerUrl],
  );

  const serverForm = React.useMemo(
    () => (
      <ServerForm url={serverUrl} basicAuth={basicAuth} onChange={saveServer} />
    ),
    [serverUrl, saveServer],
  );

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <Header
        title={t("servers.changeServer")}
        showDone
        onDone={() => navigateToMain(navigation)}
      />
      <View style={{ paddingHorizontal: 16 }}>
        {serverForm}

        <Button
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => updateServerUrl("", { required: false })}
        >
          {t("servers.removeServer")}
        </Button>
      </View>
    </Layout>
  );
}

export default React.memo(SettingsScreen);
