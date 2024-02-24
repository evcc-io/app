import React, { useState, useEffect } from "react";
import { WebView } from "react-native-webview";
import { Linking, ActivityIndicator, View, StyleSheet } from "react-native";
import { Text, Layout, Spinner, Button } from "@ui-kitten/components";
import { useAppContext } from "../components/AppContext";

function LoadingScreen() {
  return <ActivityIndicator size="large" />;
}

export default function MainScreen({ navigation }) {
  const [isConnected, setIsConnected] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);
  const { serverUrl } = useAppContext();

  useEffect(() => {
    let intervalId;

    if (!isConnected) {
      intervalId = setInterval(() => {
        console.log("Attempting to reconnect...");
        setWebViewKey((prevKey) => prevKey + 1);
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isConnected]);

  function openSettings() {
    navigation.navigate("Settings");
  }

  const handleMessage = (event) => {
    const data = JSON.parse(event.nativeEvent.data);
    console.log("message", data);
    switch (data.type) {
      case "offline":
        setIsConnected(false);
        break;
      case "online":
        setIsConnected(true);
        break;
      case "settings":
        openSettings();
        break;
    }
  };

  function onLoadStart() {
    console.log("onLoadStart");
    setIsConnected(true);
  }

  function onError(event) {
    console.log("onError", event);
    setIsConnected(false);
  }

  if (!serverUrl || serverUrl === "unknown") {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: serverUrl }}
        style={{ flex: 1 }}
        key={webViewKey}
        bounces={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        applicationNameForUserAgent={"evcc/0.0.1"}
        onError={onError}
        onLoadStart={onLoadStart}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={(event) => {
          if (!event.url.startsWith(serverUrl)) {
            Linking.openURL(event.url);
            return false;
          }
          return true;
        }}
      />
      {!isConnected && (
        <Layout style={styles.overlay}>
          <Layout
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
          >
            <Text style={{ marginVertical: 32 }} category="p1">
              Suche nach Verbindung ...
            </Text>
            <Spinner size="large" />
          </Layout>
          <Layout style={{ paddingVertical: 32 }}>
            <Button appearance="ghost" status="basic" onPress={openSettings}>
              Server ändern
            </Button>
          </Layout>
        </Layout>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
