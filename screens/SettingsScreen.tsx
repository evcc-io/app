import React from "react";
import { Layout, Button } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";

import {  useAppContext } from "../components/AppContext";
import Header from "../components/Header";

import { BasicAuthInformation } from "../interfaces/basic-auth-information";

function navigateToMain(navigation) {
  navigation.navigate("Main");
}

function SettingsScreen({ navigation }) {
  const { serverUrl, basicAuthInformation, updateServerUrl } = useAppContext();

  const saveServer = React.useCallback(
    (url, basicAuthInformation: BasicAuthInformation) => {
      updateServerUrl(url, basicAuthInformation);
      navigateToMain(navigation);
    },
    [navigation, updateServerUrl],
  );

  const serverForm = React.useMemo(
    () => <ServerForm url={serverUrl} basicAuth={basicAuthInformation} onChange={saveServer} />,
    [serverUrl, saveServer],
  );

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <Header
        title="Server ändern"
        showDone
        onDone={() => navigateToMain(navigation)}
      />
      <View style={{ paddingHorizontal: 16 }}>
        {serverForm}

        <Button
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => updateServerUrl("", {basicAuthRequired: false} as BasicAuthInformation)}
        >
          Server entfernen
        </Button>
      </View>
    </Layout>
  );
}

export default React.memo(SettingsScreen);
