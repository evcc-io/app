import React from "react";
import { Layout, Text, Button } from "@ui-kitten/components";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen({ navigation }) {
  return (
    <Layout style={{ flex: 1, paddingHorizontal: 16 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text style={{ marginVertical: 32 }} category="h2">
          Welcome to evcc
        </Text>
        <Button
          appearance="filled"
          size="giant"
          style={{ marginVertical: 64 }}
          onPress={() => navigation.navigate("Server")}
        >
          Get Started
        </Button>
      </SafeAreaView>
    </Layout>
  );
}
