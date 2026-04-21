import { Layout, Text, Button } from "@ui-kitten/components";
import { t } from "i18next";
import React, { useCallback } from "react";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";

interface AddConnectionProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Server">;
  selectServer: (url: string) => Promise<void>;
}

export default function AddConnection({
  navigation,
  selectServer,
}: AddConnectionProps): React.ReactElement {
  const manualEntry = useCallback(() => {
    navigation.navigate("ServerManual");
  }, [navigation]);

  const selectDemoServer = useCallback(async () => {
    await selectServer("https://demo.evcc.io/");
  }, []);

  return (
    <Layout style={{ flex: 1 }}>
      <Text
        testID="serverScreenTitle"
        style={{ marginVertical: 32 }}
        category="h2"
      >
        {t("servers.add.title")}
      </Text>
      <Text style={{ marginBottom: 32 }} category="p1">
        {t("servers.stored.descriptionAdd")}
      </Text>
      <Button
        testID="manualEntry"
        style={{ marginVertical: 8 }}
        appearance="filled"
        size="giant"
        status="primary"
        onPress={manualEntry}
      >
        {t("servers.manually.specify")}
      </Button>
      <Button
        testID="useDemo"
        style={{ marginVertical: 8 }}
        appearance="outline"
        status="basic"
        onPress={selectDemoServer}
      >
        {t("servers.useDemo")}
      </Button>
    </Layout>
  );
}
