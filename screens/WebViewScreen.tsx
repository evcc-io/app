import React, { useEffect, useState } from "react";
import { WebView } from "react-native-webview";
import { View, Text, StyleSheet, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const WebViewScreen = ({ route, navigation, page = "" }) => {
  const [url, setUrl] = useState("about:blank");

  useEffect(() => {
    const fetchUrl = async () => {
      const serverUrl = await AsyncStorage.getItem("serverURL");
      setUrl(serverUrl);
    };

    fetchUrl();
  }, []);

  const uri = url ? `${url}/#/${page}` : "about:blank";

  return (
    <WebView
      source={{ uri }}
      style={{ flex: 1 }}
      bounces={false}
      overScrollMode="never"
      setBuiltInZoomControls={false}
      applicationNameForUserAgent={"evcc-app/0.0.1"}
      onError={() => alert("Failed to load the page")}
      // You can also use the `onHttpError` prop to handle HTTP error codes
    />
  );
};

export default WebViewScreen;
