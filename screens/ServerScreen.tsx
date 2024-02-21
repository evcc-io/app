import React, { useState } from "react";
import Zeroconf from "react-native-zeroconf";
import { View } from "react-native";
import { Layout, Text, Button, Spinner } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../components/AppContext";
import ServerList from "../components/ServerList";

function LoadingIndicator() {
  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Spinner status="control" size="small" />
    </View>
  );
}

let zeroconf = null;

export default function ServerScreen({ navigation }) {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState([]);
  const { updateServerUrl } = useAppContext();

  const scanNetwork = () => {
    setSearching(true);
    setFound([]);
    if (zeroconf) {
      zeroconf.stop();
    }
    zeroconf = new Zeroconf();
    console.log({ zeroconf }, zeroconf.scan);
    zeroconf.scan("http", "tcp", "local.");
    zeroconf.on("resolved", (service) => {
      console.log("resolved", service);
      if (service.txt && service.name?.includes("evcc")) {
        console.log("found evcc", service);
        const {
          name,
          host,
          port,
          txt: { path },
        } = service;
        const entry = {
          title: name,
          url: `http://${host}:${port}${path}`,
        };
        setFound((prev) => [...prev, entry]);
      }
    });
    zeroconf.on("error", (error) => {
      setSearching(false);
      console.log("error", error);
    });
    zeroconf.on("stop", () => {
      setSearching(false);
      console.log("stop");
    });
  };

  const useDemoServer = () => {
    updateServerUrl("https://demo.evcc.io/");
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
          >
            Suche starten
          </Button>
          <ServerList
            entries={found}
            onSelect={(url) => updateServerUrl(url)}
          />
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
            onPress={useDemoServer}
          >
            Testinstanz verwenden
          </Button>
        </Layout>
      </SafeAreaView>
    </Layout>
  );
}
