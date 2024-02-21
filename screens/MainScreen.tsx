import React, { useState, useEffect } from "react";
import { WebView } from "react-native-webview";
import {
  Linking,
  ActivityIndicator,
  View,
  Text,
  Button,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useAppContext } from "../components/AppContext";

function LoadingScreen() {
  return <ActivityIndicator size="large" />;
}

export default function MainScreen({ navigation }) {
  const [isConnected, setIsConnected] = useState(true);
  const [webViewKey, setWebViewKey] = useState(0);
  const { serverUrl, updateServerUrl } = useAppContext();

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
    <View style={{ flex: 1 }}>
      <WebView
        source={{ uri: serverUrl }}
        style={{ flex: 1 }}
        key={webViewKey}
        bounces={false}
        overScrollMode="never"
        setBuiltInZoomControls={false}
        applicationNameForUserAgent={"evcc-app/0.0.1"}
        onError={() => setIsConnected(false)}
        onLoad={() => setIsConnected(true)}
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
        <View style={styles.overlay}>
          <Text style={styles.text}>
            The site is not reachable. Attempting to reconnect...
          </Text>
          <TouchableOpacity
            onPress={() => setWebViewKey((prevKey) => prevKey + 1)} // Manually trigger reload
            style={styles.button}
          >
            <Text style={styles.buttonText}>Retry Now</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  text: {
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
  },
});
