import React, { useState } from "react";
import Zeroconf from "react-native-zeroconf";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";
import { Alert } from "react-native";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";
import LoadingIndicator from "../components/LoadingIndicator";
import { verifyEvccServer } from "../utils/server";

let zeroconf = null;

export default function ServerScreen({ navigation }) {
  const [searching, setSearching] = useState(false);
  const [finished, setFinished] = useState(false);
  const [scanNotPossible, setScanNotPossible] = useState(false);
  const [found, setFound] = useState([]);
  const { updateServerUrl } = useAppContext();

  const scanNetwork = () => {
    setSearching(true);
    setFinished(false);
    setFound([]);

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

    zeroconf.on("resolved", (service) => {
      console.log("resolved", service);
      if (service.txt && service.name?.includes("evcc")) {
        console.log("found evcc", service);
        // remove trailing dots
        const host = service.host.replace(/\.$/, "");
        const entry = {
          title: service.name,
          url: `http://${host}:${service.port}${service.txt.path}`,
        };
        setFound((prev) => [...prev, entry]);
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
  };

  const selectDemoServer = async () => {
    await selectServer("https://demo.evcc.io/");
  };

  const selectServer = async (url) => {
    try {
      await verifyEvccServer(url);
      updateServerUrl(url);
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const manualEntry = () => {
    navigation.navigate("ServerManual");
  };

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
