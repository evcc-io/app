import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { ActivityIndicator, StyleSheet, Animated } from "react-native";
import * as Linking from "expo-linking";
import { Text, Layout, Spinner, Button } from "@ui-kitten/components";
import { useAppContext } from "../components/AppContext";
import { useTranslation } from "react-i18next";
import { USER_AGENT } from "../utils/constants";
import {
  FileDownloadEvent,
  ShouldStartLoadRequest,
  WebViewErrorEvent,
  WebViewHttpErrorEvent,
  WebViewTerminatedEvent,
} from "react-native-webview/lib/WebViewTypes";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "types";

function LoadingScreen() {
  return <ActivityIndicator size="large" />;
}

export default function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { t } = useTranslation();
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
    let intervalId: NodeJS.Timeout | undefined;

    if (!isConnected) {
      intervalId = setInterval(() => {
        console.log("Attempting to reconnect...");
        setWebViewKey((prevKey) => prevKey + 1);
      }, 5000);
    }

    return () => clearInterval(intervalId);
  }, [isConnected]);

  useEffect(() => {
    const duration = 400;
    const smallDelay = 500;
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
  }, [isConnected]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
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
    (event: ShouldStartLoadRequest) => {
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
  }, []);

  const onError = useCallback((event: WebViewErrorEvent) => {
    console.log("onError", event);
    setIsConnected(false);
  }, []);

  const onHttpError = useCallback((event: WebViewHttpErrorEvent) => {
    console.log("onHttpError", event);
    setIsConnected(false);
  }, []);

  const onTerminate = useCallback((event: WebViewTerminatedEvent) => {
    console.log("onTerminate", event);
    setIsConnected(false);
  }, []);

  const onFileDownload = ({
    nativeEvent: { downloadUrl },
  }: FileDownloadEvent) => {
    if (downloadUrl) Linking.openURL(downloadUrl);
  };

  const LoadingScreenMemoized = useMemo(() => <LoadingScreen />, []);

  const { required, username, password } = basicAuth;
  const basicAuthCredential =
    required && username && password ? { username, password } : undefined;

  const LayoutMemoized = useMemo(
    () => (
      <Layout style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          <WebView
            basicAuthCredential={basicAuthCredential}
            source={{ uri: serverUrl }}
            style={{ flex: 1 }}
            key={webViewKey}
            bounces={false}
            ref={webViewRef}
            overScrollMode="never"
            setBuiltInZoomControls={false}
            applicationNameForUserAgent={USER_AGENT}
            onError={onError}
            onHttpError={onHttpError}
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
              {t("servers.search.searching")}
            </Text>
            <Spinner size="large" />
          </Layout>
          <Layout style={{ paddingVertical: 32 }}>
            <Button appearance="ghost" status="basic" onPress={openSettings}>
              {t("servers.changeServer")}
            </Button>
          </Layout>
        </Animated.View>
      </Layout>
    ),
    [
      serverUrl,
      basicAuthCredential,
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
