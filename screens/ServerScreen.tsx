import React, { useState, useCallback } from "react";
import * as ServiceDiscovery from "@inthepocket/react-native-service-discovery";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";
import LoadingIndicator from "../components/animations/LoadingIndicator";
import {
  fetchOrGetTitle,
  getTitle,
  sameServer,
  verifyEvccServer,
} from "../utils/server";
import { useTranslation } from "react-i18next";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList, Server } from "types";

export default function ServerScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Server">) {
  const { t } = useTranslation();
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState<Server[]>([]);

  const { addServer, setActiveServer } = useAppContext();

  const getUrl = (service: ServiceDiscovery.Service) => {
    const scheme = service.type === "_http._tcp." ? "http" : "https";
    const hostName = service.hostName.endsWith(".")
      ? service.hostName.slice(0, -1)
      : service.hostName;
    const port =
      service.port === 80 || service.port === 443 ? "" : `:${service.port}`;
    return `${scheme}://${hostName}${port}`;
  };

  const toServer = (service: ServiceDiscovery.Service): Server => {
    return { url: getUrl(service), basicAuth: {} };
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
      async (service: ServiceDiscovery.Service) => {
        if (service.name === "evcc") {
          console.log("Found service ", service);
          const server = toServer(service);
          server.title = await fetchOrGetTitle(server);

          setFound((found) => {
            if (!found.some((f) => sameServer(f, server))) {
              return [...found, server];
            } else {
              return found;
            }
          });
        }
      },
    );

    const lostListener = ServiceDiscovery.addEventListener(
      "serviceLost",
      async (service: ServiceDiscovery.Service) => {
        if (service.name === "evcc") {
          console.log("Lost service ", service);
          const server = toServer(service);

          setFound((found) => {
            return found.filter((f) => !sameServer(f, server));
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
    const server = { url: "https://demo.evcc.io/", basicAuth: {} } as Server;
    server.title = getTitle(server);
    await selectServer(server);
  }, []);

  const selectServer = useCallback(
    async (server: Server) => {
      try {
        const finalUrl = await verifyEvccServer(server);
        await addServer({ ...server, url: finalUrl });
        setActiveServer(server);
      } catch (error) {
        Alert.alert((error as Error).message);
      }
    },
    [addServer],
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

          <Button
            style={{ marginTop: 8, marginBottom: 32 }}
            appearance="filled"
            size="giant"
            onPress={scanNetwork}
            accessoryLeft={searching ? LoadingIndicator : undefined}
            disabled={scanNotPossible}
            testID="serverSearchButton"
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
