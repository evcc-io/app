import React, { useState } from "react";
import axios from "axios";
import { Layout, Text, Button, Input } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppContext } from "../components/AppContext";

export default function ServerScreen() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const { updateServerUrl } = useAppContext();

  const validateAndSaveURL = async () => {
    setError("");
    try {
      const response = await axios.get(url);
      if (response.data.includes("evcc")) {
        updateServerUrl(url);
      } else {
        setError(
          "Server is reachable, but doesn't seem to be an evcc installation.",
        );
      }
    } catch (error) {
      setError("Unable to reach server. Please check the URL and try again.");
    }
  };

  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text category="h2" style={{ marginTop: 0, marginBottom: 32 }}>
          Adresse eingeben
        </Text>
        <Input
          style={{ marginBottom: 32 }}
          placeholder="http://evcc.local:7070/"
          value={url}
          size="large"
          status={error ? "danger" : "basic"}
          onChangeText={(nextValue) => setUrl(nextValue)}
        />
        <Button
          style={{ marginTop: 8, marginBottom: 16 }}
          appearance="filled"
          size="giant"
          onPress={validateAndSaveURL}
        >
          Prüfen und speichern
        </Button>
        {error ? (
          <Text style={{ marginTop: 16 }} category="p1">
            {error}
          </Text>
        ) : null}
      </SafeAreaView>
    </Layout>
  );
}
