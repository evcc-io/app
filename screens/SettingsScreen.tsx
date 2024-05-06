import React from "react";
import { Layout, Button } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";

import { useAppContext } from "../components/AppContext";
import Header from "../components/Header";

function navigateToMain(navigation) {
  navigation.navigate("Main");
}

function SettingsScreen({ navigation }) {
  const { serverUrl, updateServerUrl } = useAppContext();

  const saveServer = React.useCallback(
    (url) => {
      updateServerUrl(url);
      navigateToMain(navigation);
    },
    [navigation, updateServerUrl],
  );

  const serverForm = React.useMemo(
    () => <ServerForm url={serverUrl} onChange={saveServer} />,
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
          onPress={() => updateServerUrl("")}
        >
          Server entfernen
        </Button>
      </View>
    </Layout>
  );
}

export default React.memo(SettingsScreen);
