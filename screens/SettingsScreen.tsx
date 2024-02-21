import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";
import { useAppContext } from "../components/AppContext";

export default function SettingsScreen({ navigation }) {
  const { serverUrl, updateServerUrl } = useAppContext();
  const [url, setUrl] = useState(serverUrl);

  function navigateToMain() {
    navigation.navigate("Main");
  }

  function saveServer() {
    updateServerUrl(url);
    navigateToMain();
  }

  return (
    <View>
      <Button title="Server zurücksetzen" onPress={() => updateServerUrl("")} />
      <Text>-</Text>
      <TextInput
        style={styles.input}
        value={url}
        onChangeText={setUrl}
        autoCapitalize="none"
      />
      <Button title="Save" onPress={saveServer} />
      <Button title="Done" onPress={navigateToMain} />
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
