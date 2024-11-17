import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { WebView } from "react-native-webview";
import {
  Linking,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Alert,
  Platform,
  Share,
} from "react-native";
import { Text, Layout, Spinner, Button } from "@ui-kitten/components";
import { useAppContext } from "../components/AppContext";
import RNFetchBlob from "react-native-blob-util";

function LoadingScreen() {
  return <ActivityIndicator size="large" />;
}

export default function MainScreen({ navigation }) {
  const { serverUrl, basicAuth } = useAppContext();
  const webViewRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  const contFade = useRef(new Animated.Value(isConnected ? 1 : 0)).current;
  const loadFade = useRef(new Animated.Value(isConnected ? 0 : 1)).current;
  const loadScale = useRef(new Animated.Value(isConnected ? 1.2 : 1)).current;

  const openSettings = useCallback(() => {
    navigation.navigate("Settings");
  }, [navigation]);

  // Reconnect if connection is lost
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

  useEffect(() => {
    const duration = 600;
    const smallDelay = 1000;
    const largeDelay = smallDelay + duration * 0.3;
    Animated.timing(contFade, {
      toValue: isConnected ? 1 : 0,
      delay: isConnected ? largeDelay : smallDelay,
      duration,
      useNativeDriver: true,
    }).start();

    Animated.timing(loadFade, {
      toValue: isConnected ? 0 : 1,
      delay: isConnected ? smallDelay : largeDelay,
      duration,
      useNativeDriver: true,
    }).start();

    Animated.timing(loadScale, {
      toValue: isConnected ? 1.2 : 1,
      delay: isConnected ? smallDelay : largeDelay,
      duration,
      useNativeDriver: true,
    }).start();
  }, [isConnected, contFade, loadFade, loadScale]);

  const handleMessage = useCallback(
    (event) => {
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
    },
    [openSettings],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (event) => {
      if (!event.url.startsWith(serverUrl)) {
        Linking.openURL(event.url);
        return false;
      }
      return true;
    },
    [serverUrl],
  );

  const onLoad = useCallback(() => {
    console.log("onLoad");
    setIsConnected(true);
  }, []);

  const onError = useCallback((event) => {
    console.log("onError", event);
    setIsConnected(false);
  }, []);

  const onTerminate = useCallback((event) => {
    console.log("onTerminate", event);
    setIsConnected(false);
  }, []);

  const onFileDownload = async ({ nativeEvent: { downloadUrl } }) => {
    if (!downloadUrl) return;

    try {
      // Get filename from URL or use default
      const filename = downloadUrl.split("/").pop() || "download";

      // Configure download options
      const config = {
        fileCache: true,
        // Use appropriate directory based on platform
        path: `${RNFetchBlob.fs.dirs.CacheDir}/${filename}`,
        // Include auth headers if needed
        headers: basicAuth.required
          ? {
              Authorization: `Basic ${btoa(`${basicAuth.username}:${basicAuth.password}`)}`,
            }
          : {},
      };

      // Download the file
      const res = await RNFetchBlob.config(config).fetch("GET", downloadUrl);
      const filePath = res.path();

      // Share the file
      if (Platform.OS === "ios") {
        // iOS: Use Share API
        await Share.share({
          url: `file://${filePath}`,
        });
      } else {
        // Android: Use Android sharing
        await RNFetchBlob.android.actionViewIntent(filePath, "*/*");
      }

      // Clean up the temp file
      await RNFetchBlob.fs.unlink(filePath);
    } catch (error) {
      console.error("Download failed:", error);
      // Show error to user (you can use your preferred UI component)
      Alert.alert("Download Failed", "Could not download the file.");
    }
  };

  const LoadingScreenMemoized = useMemo(() => <LoadingScreen />, []);

  const LayoutMemoized = useMemo(
    () => (
      <Layout style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          <WebView
            basicAuthCredential={
              basicAuth.required
                ? {
                    username: basicAuth.username,
                    password: basicAuth.password,
                  }
                : undefined
            }
            source={{ uri: serverUrl }}
            style={{ flex: 1 }}
            key={webViewKey}
            bounces={false}
            ref={webViewRef}
            overScrollMode="never"
            setBuiltInZoomControls={false}
            applicationNameForUserAgent={"evcc/0.0.1"}
            onError={onError}
            onLoad={onLoad}
            onContentProcessDidTerminate={onTerminate}
            onMessage={handleMessage}
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            onFileDownload={onFileDownload}
          />
        </Animated.View>
        <Animated.View
          style={{
            ...styles.overlay,
            opacity: loadFade,
            transform: [{ scale: loadScale }],
            pointerEvents: isConnected ? "none" : "auto",
          }}
        >
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
        </Animated.View>
      </Layout>
    ),
    [
      serverUrl,
      webViewKey,
      contFade,
      loadFade,
      loadScale,
      isConnected,
      onError,
      onLoad,
      onTerminate,
      handleMessage,
      onShouldStartLoadWithRequest,
      openSettings,
      basicAuth.required,
      basicAuth.username,
      basicAuth.password,
    ],
  );

  if (!serverUrl || serverUrl === "unknown") {
    return LoadingScreenMemoized;
  }

  console.log("serverUrl", { serverUrl, isConnected });

  return LayoutMemoized;
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
