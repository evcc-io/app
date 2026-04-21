import React, { useCallback } from "react";
import {
  Layout,
  Text,
  Button,
  Divider,
  List,
  ListItem,
} from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { useAppContext } from "../components/AppContext";
import { verifyEvccServer } from "../utils/server";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Connection, RootStackParamList } from "types";
import MdnsSearch from "components/MdnsSearch";

export default function ServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Server">) {
  const { t } = useTranslation();
  const { updateConnection } = useAppContext();

  const selectDemoServer = useCallback(async () => {
    await selectServer("https://demo.evcc.io/");
  }, []);

  const selectServer = useCallback(
    async (url: string) => {
      try {
        const finalUrl = await verifyEvccServer({
          url,
        });
        updateConnection({ url: finalUrl });
      } catch (error) {
        Alert.alert((error as Error).message);
      }
    },
    [updateConnection],
  );

  const manualEntry = useCallback(() => {
    navigation.navigate("ServerManual");
  }, [navigation]);

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Layout style={{ flex: 1 }}>
          <Text
            testID="serverScreenTitle"
            style={{ marginVertical: 32 }}
            category="h2"
          >
            {t("main.title")}
          </Text>
          <Text style={{ marginBottom: 32 }} category="p1">
            {t("main.description")}
          </Text>

          <MdnsSearch selectServer={selectServer} />

          <Divider style={{ backgroundColor: "white" }} />
          <Layout>
            <Text
              testID="serverScreenTitle"
              style={{ marginVertical: 32 }}
              category="h2"
            >
              {t("servers.stored.title")}
            </Text>
            <Text style={{ marginBottom: 32 }} category="p1">
              {t("servers.stored.description")}
            </Text>
            <List
              data={
                [
                  { url: "test", basicAuth: { required: false } },
                ] satisfies Connection[]
              }
              renderItem={({ index, item }) => {
                return (
                  <ListItem
                    title={`Connection #${index + 1}`}
                    description={item.url}
                    accessoryRight={() => <Button size="small"> Click </Button>}
                    testID={"serverSearchListItem" + index}
                  />
                );
              }}
            ></List>
          </Layout>
        </Layout>
        <Layout style={{ paddingVertical: 16 }}>
          <Button
            testID="manualEntry"
            style={{ marginVertical: 8 }}
            appearance="outline"
            status="primary"
            onPress={manualEntry}
          >
            {t("servers.manually.specify")}
          </Button>
          <Button
            testID="useDemo"
            style={{ marginVertical: 8 }}
            appearance="ghost"
            status="basic"
            onPress={selectDemoServer}
          >
            {t("servers.useDemo")}
          </Button>
        </Layout>
      </SafeAreaView>
    </Layout>
  );
}
