import React, { useState, useCallback } from "react";
import Zeroconf from "react-native-zeroconf";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";
import LoadingIndicator from "../components/LoadingIndicator";
import { verifyEvccServer } from "../utils/server";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";

export interface Entry {
  title: string;
  url: string;
}

export default function ServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Server">) {
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState<Entry[]>([]);
  const { updateServerUrl } = useAppContext();

  const scanNetwork = useCallback(() => {
    setSearching(true);
    setFinished(false);
    setFound([]);

    let zeroconf: Zeroconf | null = null;

    try {
      if (zeroconf) {
        (zeroconf as Zeroconf).stop();
      }
      zeroconf = new Zeroconf();
      zeroconf.scan("http", "tcp", "local.");
    } catch (e) {
      console.log("error", e);
      setSearching(false);
      setScanNotPossible(true);
    }

    zeroconf?.on("resolved", ({ txt, name, host, port }) => {
      console.log("resolved", name);
      if (txt && name?.includes("evcc")) {
        console.log("found evcc", name);
        // remove trailing dots
        const entry = {
          title: name,
          url: `http://${host.replace(/\.$/, "")}${port === 80 ? "" : `:${port}`}${txt["path"]}`,
        };
        setFound((prevFound) => [...prevFound, entry]);
      }
    });
    zeroconf?.on("error", (error) => {
      setSearching(false);
      zeroconf?.stop();
      console.log("error", error);
    });
    zeroconf?.on("stop", () => {
      setSearching(false);
      setFinished(true);
      zeroconf?.removeDeviceListeners();
      console.log("stop");
    });
  }, []);

  const selectDemoServer = useCallback(async () => {
    await selectServer("https://demo.evcc.io/");
  }, []);

  const selectServer = useCallback(
    async (url: string) => {
      try {
        const finalUrl = await verifyEvccServer(url, { required: false });
        updateServerUrl(finalUrl, { required: false });
        navigation.navigate("Main");
      } catch (error) {
        Alert.alert((error as Error).message);
      }
    },
    [updateServerUrl],
  );

  const manualEntry = useCallback(() => {
    navigation.navigate("ServerManual");
  }, [navigation]);

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Layout style={{ flex: 1 }}>
          <Text style={{ marginVertical: 32 }} category="h2">
            {t("main.title")}
          </Text>
          <Text style={{ marginBottom: 32 }} category="p1">
            {t("main.description")}
          </Text>

          <Button
            style={{ marginTop: 8, marginBottom: 32 }}
            appearance="filled"
            size="giant"
            onPress={scanNetwork}
            accessoryLeft={searching ? LoadingIndicator : undefined}
            disabled={scanNotPossible}
          >
            {t("servers.search.start")}
          </Button>

          {scanNotPossible ? (
            <Text style={{ marginVertical: 16 }} category="p1">
              {t("servers.search.notAvailable")}
            </Text>
          ) : null}
          {finished && found.length === 0 ? (
            <Text style={{ marginVertical: 16 }} category="p1">
              {t("servers.search.nothingFound")}
            </Text>
          ) : (
            <ServerList entries={found} onSelect={selectServer} />
          )}
        </Layout>
        <Layout style={{ paddingVertical: 16 }}>
          <Button
            style={{ marginVertical: 8 }}
            appearance="outline"
            status="primary"
            onPress={manualEntry}
          >
            {t("servers.manually.specify")}
          </Button>
          <Button
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
