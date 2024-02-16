import React from "react";
import { WebView } from "react-native-webview";
import { View, Text, StyleSheet, Button } from "react-native";

const WebViewScreen = ({ route, navigation }) => {
  const { url } = route.params;

  // Optionally, implement logic here to check if the URL is reachable

  return (
    <WebView
      source={{ uri: url }}
      style={{ flex: 1 }}
      onError={() => alert("Failed to load the page")}
      // You can also use the `onHttpError` prop to handle HTTP error codes
    />
  );
};

export default WebViewScreen;
