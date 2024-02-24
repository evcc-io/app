import React, { useState } from "react";
import { Layout, Text, Button, Input } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../components/AppContext";

export default function SettingsScreen({ navigation }) {
  const { serverUrl, updateServerUrl } = useAppContext();
  const [url, setUrl] = useState(serverUrl);

  function navigateToMain() {
    navigation.navigate("Main");
  }

  function saveServer() {
    updateServerUrl(url);
    navigateToMain();
  }

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text category="h4" style={{ marginTop: 0, marginBottom: 32 }}>
          Server ändern
        </Text>
        <Input
          style={{ marginBottom: 16 }}
          placeholder="http://evcc.local:7070/"
          value={url}
          size="large"
          onChangeText={(nextValue) => setUrl(nextValue)}
        />
        <Button
          style={{ marginVertical: 16 }}
          appearance="filled"
          onPress={saveServer}
        >
          Speichern
        </Button>
        <Button
          style={{ marginVertical: 16 }}
          appearance="ghost"
          status="danger"
          onPress={() => updateServerUrl("")}
        >
          Server entfernen
        </Button>
      </SafeAreaView>
    </Layout>
  );
}
