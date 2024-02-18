import React from "react";
import { View, Text, Button } from "react-native";
import { useAppContext } from "../components/AppContext";

export default function SettingsScreen({ navigation }) {
  const { serverUrl, updateServerUrl } = useAppContext();

  return (
    <View>
      <Button title="Server zurücksetzen" onPress={() => updateServerUrl("")} />
      <Text>{serverUrl}</Text>
      <Button title="Done" onPress={() => navigation.navigate("Main")} />
    </View>
  );
}
