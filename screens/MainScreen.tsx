import React from "react";
import { WebView } from "react-native-webview";
import { Linking, ActivityIndicator } from "react-native";
import { useAppContext } from "../components/AppContext";

function LoadingScreen() {
  return <ActivityIndicator size="large" />;
}

export default function MainScreen({ navigation }) {
  const { serverUrl } = useAppContext();

  const handleMessage = (event) => {
    const data = event.nativeEvent.data;
    if (data === "settings") {
      navigation.navigate("Settings");
    }
  };

  if (!serverUrl || serverUrl === "unknown") {
    return <LoadingScreen />;
  }

  return (
    <WebView
      source={{ uri: serverUrl }}
      style={{ flex: 1 }}
      bounces={false}
      overScrollMode="never"
      setBuiltInZoomControls={false}
      applicationNameForUserAgent={"evcc-app/0.0.1"}
      onError={() => alert("Failed to load the page")}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={(event) => {
        if (!event.url.startsWith(serverUrl)) {
          Linking.openURL(event.url);
          return false;
        }
        return true;
      }}
    />
  );
}
