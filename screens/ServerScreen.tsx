import React, { useState, useCallback } from "react";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";
import LoadingIndicator from "../components/LoadingIndicator";
import { verifyEvccServer } from "../utils/server";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { EvccInstance, RootStackParamList } from "types";

export default function ServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Server">) {
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState<EvccInstance[]>([]);

  const { updateServerUrl } = useAppContext();

  const toEvccInstance = (service: ServiceDiscovery.Service): EvccInstance => {
    let title = service.hostName;
    for (const s of [".local.", ".fritz.box"]) {
      if (title.endsWith(s)) {
        title = title.slice(0, -1 * s.length);
        break;
      }
    }

    const scheme = service.type === "_http._tcp." ? "http" : "https";
    const hostName = service.hostName.endsWith(".")
      ? service.hostName.slice(0, -1)
      : service.hostName;
    const port =
      service.port === 80 || service.port === 443 ? "" : `:${service.port}`;

    return { title: title, url: `${scheme}://${hostName}${port}` };
  };

  const sameInstance = (a: EvccInstance, b: EvccInstance) => {
    return a.title === b.title && a.url === b.url;
  };

  const scanNetwork = useCallback(() => {
    // for multiple clicks on button
    ServiceDiscovery.stopSearch("http");
    ServiceDiscovery.stopSearch("https");

    setSearching(true);
    setFinished(false);
    setFound([]);

    const foundListener = ServiceDiscovery.addEventListener(
      "serviceFound",
      (service) => {
        if (service.name === "evcc") {
          console.log("Found service ", service);
          setFound((found) => {
            const evccInstance = toEvccInstance(service);
            if (!found.some((s) => sameInstance(evccInstance, s))) {
              return [...found, evccInstance];
            } else {
              return found;
            }
          });
        }
      },
    );

    const lostListener = ServiceDiscovery.addEventListener(
      "serviceLost",
      (service) => {
        if (service.name === "evcc") {
          console.log("Lost service ", service);
          setFound((found) => {
            return found.filter(
              (s) => !sameInstance(toEvccInstance(service), s),
            );
          });
        }
      },
    );

    (async () => {
      try {
        await Promise.all([
          ServiceDiscovery.startSearch("http"),
          ServiceDiscovery.startSearch("https"),
        ]);

        setTimeout(() => {
          ServiceDiscovery.stopSearch("http");
          ServiceDiscovery.stopSearch("https");

          foundListener.remove();
          lostListener.remove();

          setSearching(false);
          setFinished(true);
        }, 60 * 1000);
      } catch (e) {
        console.log("error", e);
        setSearching(false);
        setScanNotPossible(true);
      }
    })();
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
            <ServerList entries={Array.from(found)} onSelect={selectServer} />
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
