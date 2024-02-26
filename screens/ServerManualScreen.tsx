import React from "react";
import { Layout } from "@ui-kitten/components";
import { View } from "react-native";
import ServerForm from "../components/ServerForm";
import Header from "../components/Header";

import { useAppContext } from "../components/AppContext";

export default function ServerManualScreen({ navigation }) {
  const { updateServerUrl } = useAppContext();

  function navigateToServer() {
    navigation.navigate("Server");
  }

  return (
    <Layout style={{ flex: 1 }}>
      <Header title="URL eingeben" showDone onDone={navigateToServer} />
      <View style={{ paddingHorizontal: 16 }}>
        <ServerForm onChange={updateServerUrl} />
      </View>
    </Layout>
  );
}
