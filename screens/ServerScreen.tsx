import React, { useState } from "react";
import axios from "axios";
import Zeroconf from "react-native-zeroconf";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";

import { useAppContext } from "../components/AppContext";

export default function ServerScreen() {
  const [url, setUrl] = useState("");
  const { updateServerUrl } = useAppContext();

  const validateAndSaveURL = async () => {
    try {
      const response = await axios.get(url);
      if (response.data.includes("evcc")) {
        updateServerUrl(url);
      } else {
        Alert.alert(
          "Validation Error",
          "The URL does not contain the required content.",
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch the URL. Please check the URL and your network connection.",
      );
    }
  };

  const scanNetwork = () => {
    const zeroconf = new Zeroconf();
    console.log({ zeroconf }, zeroconf.scan);
    zeroconf.scan("http", "tcp", "local.");
    zeroconf.on("resolved", (service) => {
      console.log("resolved", service);
      if (service.txt && service.name?.includes("evcc")) {
        console.log("found evcc", service);
        zeroconf.stop();
        const {
          host,
          port,
          txt: { path },
        } = service;
        setUrl(`http://${host}:${port}${path}`);
      }
    });
    zeroconf.on("error", (error) => {
      console.log("error", error);
    });
    zeroconf.on("stop", () => {
      console.log("stop");
    });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setUrl}
        value={url}
        placeholder="http://evcc.local:7070/"
        autoCapitalize="none"
      />
      <Button title="Go" onPress={validateAndSaveURL} />
      <Button title="Detect" onPress={scanNetwork} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "gray",
    marginBottom: 20,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 18,
  },
});
