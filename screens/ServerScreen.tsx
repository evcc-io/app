import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert, Text } from "react-native";
import axios from "axios";
import { useAppContext } from "../components/AppContext";
import Zeroconf from "react-native-zeroconf";

export default function ServerScreen() {
  const [url, setUrl] = useState("");
  const [foundServers, setFoundServers] = useState([] as string[]);
  const { updateServerUrl } = useAppContext();

  const scanLocalNetwork = () => {
    const zeroconf = new Zeroconf();
    console.log({ zeroconf });
    zeroconf.on("resolved", (service) => {
      const { addresses, name, port } = service;
      const url = `http://${addresses[0]}:${port} (${name})`;
      setFoundServers([...foundServers, url]);
    });
    zeroconf.scan("http", "tcp", "local.");
  };

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

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        onChangeText={setUrl}
        value={url}
        placeholder="Local evcc URL"
        autoCapitalize="none"
      />
      <Button title="Go" onPress={validateAndSaveURL} />
      <Button title="Scan local network" onPress={scanLocalNetwork} />
      <Text>Found servers:</Text>
      {foundServers.map((server) => (
        <Text>{server}</Text>
      ))}
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
