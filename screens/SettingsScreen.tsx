import React from "react";
import { Layout, Button } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";

import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";

export default function SettingsScreen({ navigation }) {
  const { serverUrl, updateServerUrl } = useAppContext();

  function navigateToMain() {
    navigation.navigate("Main");
  }

  function saveServer(url) {
    updateServerUrl(url);
    navigateToMain();
  }

  return (
    <Layout style={{ flex: 1, paddingBottom: 32 }}>
      <Header title="Server ändern" showDone onDone={navigateToMain} />
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm url={serverUrl} onChange={saveServer} />

        <Button
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => updateServerUrl("")}
        >
          Server entfernen
        </Button>
      </View>
    </Layout>
  );
}
