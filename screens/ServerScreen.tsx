import React, { useState, useCallback } from "react";
import Zeroconf from "react-native-zeroconf";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";
import LoadingIndicator from "../components/LoadingIndicator";
import { verifyEvccServer } from "../utils/server";

export default function ServerScreen({ navigation }) {
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState([]);
  const { updateServerUrl } = useAppContext();

  const scanNetwork = useCallback(() => {
    setSearching(true);
    setFinished(false);
    setFound([]);

    let zeroconf = null;

    try {
      if (zeroconf) {
        zeroconf.stop();
      }
      zeroconf = new Zeroconf();
      zeroconf.scan("http", "tcp", "local.");
    } catch (e) {
      console.log("error", e);
      setSearching(false);
      setScanNotPossible(true);
    }

    zeroconf.on("resolved", ({ txt, name, host, port }) => {
      console.log("resolved", name);
      if (txt && name?.includes("evcc")) {
        console.log("found evcc", name);
        // remove trailing dots
        const entry = {
          title: name,
          url: `http://${host.replace(/\.$/, "")}:${port}${txt.path}`,
        };
        setFound((prevFound) => [...prevFound, entry]);
      }
    });
    zeroconf.on("error", (error) => {
      setSearching(false);
      zeroconf.stop();
      console.log("error", error);
    });
    zeroconf.on("stop", () => {
      setSearching(false);
      setFinished(true);
      zeroconf.removeDeviceListeners();
      console.log("stop");
    });
  }, []);

  const selectServer = useCallback(
    async (url) => {
      try {
        const finalUrl = await verifyEvccServer(url, { required: false });
        updateServerUrl(finalUrl, { required: false });
      } catch (error) {
        if (error.message === "Missing Authentication") {
          navigation.navigate("ServerManual", {
            url: url,
            basicAuth: { required: true },
          });
        } else {
          Alert.alert(error.message);
        }
      }
    },
    [updateServerUrl, navigation],
  );

  const selectDemoServer = useCallback(async () => {
    await selectServer("https://demo.evcc.io/");
  }, [selectServer]);

  const manualEntry = useCallback(() => {
    navigation.navigate("ServerManual");
  }, [navigation]);

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Layout style={{ flex: 1 }}>
          <Text style={{ marginVertical: 32 }} category="h2">
            Server einrichten
          </Text>
          <Text style={{ marginBottom: 32 }} category="p1">
            Durchsuche dein Netzwerk und deine evcc Installation zu finden.
          </Text>

          <Button
            style={{ marginTop: 8, marginBottom: 32 }}
            appearance="filled"
            size="giant"
            onPress={scanNetwork}
            accessoryLeft={searching ? LoadingIndicator : null}
            disabled={scanNotPossible}
          >
            Suche starten
          </Button>

          {scanNotPossible ? (
            <Text style={{ marginVertical: 16 }} category="p1">
              Die Suche ist auf diesem Gerät nicht möglich. Nutze die manuelle
              Eingabe.
            </Text>
          ) : null}
          {finished && found.length === 0 ? (
            <Text style={{ marginVertical: 16 }} category="p1">
              Es wurde kein evcc Server gefunden.
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
            Adresse manuell eingeben
          </Button>
          <Button
            style={{ marginVertical: 8 }}
            appearance="ghost"
            status="basic"
            onPress={selectDemoServer}
          >
            Testinstanz verwenden
          </Button>
        </Layout>
      </SafeAreaView>
    </Layout>
  );
}
