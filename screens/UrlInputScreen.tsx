import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const URLInputScreen = ({ navigation }) => {
  const [url, setUrl] = useState("");

  const validateAndSaveURL = async () => {
    try {
      const response = await axios.get(url);
      if (response.data.includes("evcc")) {
        await AsyncStorage.setItem("serverURL", url);
        navigation.navigate("WebView", { url });
      } else {
        Alert.alert(
          "Validation Error",
          "The URL does not contain the required content."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to fetch the URL. Please check the URL and your network connection."
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
    </View>
  );
};

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

export default URLInputScreen;
