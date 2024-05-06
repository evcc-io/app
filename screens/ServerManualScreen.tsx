import React from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";

import { useAppContext } from "../components/AppContext";

function navigateToServer(navigation) {
  navigation.navigate("Server");
}

function ServerManualScreen({ navigation }) {
  const { updateServerUrl } = useAppContext();

  const memoizedUpdateServerUrl = React.useCallback(updateServerUrl, []);

  const memoizedHeader = React.useMemo(
    () => (
      <Header
        title="URL eingeben"
        showDone
        onDone={() => navigateToServer(navigation)}
      />
    ),
    [navigation],
  );

  return (
    <Layout style={{ flex: 1 }}>
      {memoizedHeader}
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm onChange={memoizedUpdateServerUrl} />
      </View>
    </Layout>
  );
}

export default React.memo(ServerManualScreen);
