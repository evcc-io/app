import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { WebView, WebViewMessageEvent } from "react-native-webview";
import { StyleSheet, Animated, View } from "react-native";
import * as Linking from "expo-linking";
import { Text, Layout, Button } from "@ui-kitten/components";
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
import { shareFileFromUrl } from "utils/shareFile";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Spinner from "components/animations/Spinner";
import ActivityIndicator from "components/animations/ActivityIndicator";
import { encode as base64Encode } from "base-64"; // base-64 package (common in RN projects)

function LoadingScreen() {
  return <ActivityIndicator size="large" animating={true} />;
}

export default function MainScreen({
  navigation,
}: NativeStackScreenProps<RootStackParamList, "Main">) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { serverUrl, basicAuth } = useAppContext();
  const webViewRef = useRef<WebView | null>(null);
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
      try {
        const data = JSON.parse(event.nativeEvent.data);
        console.log("message from webview:", data);
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
          default:
            // unknown message - just log
            break;
        }
      } catch (err) {
        console.log(
          "Failed to parse message from webview:",
          err,
          event.nativeEvent.data,
        );
      }
    },
    [openSettings],
  );

  const onShouldStartLoadWithRequest = useCallback(
    (event: ShouldStartLoadRequest) => {
      if (!event.url.startsWith(serverUrl)) {
        Linking.openURL(event.url).catch((e) =>
          console.warn("Linking openURL failed", e),
        );
        return false;
      }
      return true;
    },
    [serverUrl],
  );

  const onLoad = useCallback(() => {
    console.log("onLoad fired");
  }, []);

  const onLoadStart = useCallback(() => {
    console.log("WebView onLoadStart");
    // keep overlay until onLoadEnd unless your app posts 'online'
    setIsConnected(false);
  }, []);

  const onLoadEnd = useCallback((event: any) => {
    console.log("WebView onLoadEnd", event?.nativeEvent?.url);
    // Mark connected when webview finished loading a page (may be initial navigation)
    setIsConnected(true);
  }, []);

  const onLoadProgress = useCallback(({ nativeEvent }: any) => {
    console.log("WebView progress:", nativeEvent?.progress);
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
    shareFileFromUrl(downloadUrl);
  };

  const LoadingScreenMemoized = useMemo(() => <LoadingScreen />, []);

  const { required, username, password } = basicAuth;
  const basicAuthCredential =
    required && username && password ? { username, password } : undefined;

  // Build headers for Basic Auth as fallback (more consistent across iOS/Android)
  const headers = basicAuthCredential
    ? {
        Authorization:
          "Basic " +
          base64Encode(
            `${basicAuthCredential.username}:${basicAuthCredential.password}`,
          ),
      }
    : undefined;

  const LayoutMemoized = useMemo(
    () => (
      <Layout style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, opacity: contFade }}>
          {/* Wrapper View with testID: auf iOS ist das zuverlässiger für Detox */}
          <View
            testID="mainWebView"
            accessible
            accessibilityLabel="mainWebView"
            style={{ flex: 1 }}
          >
            <WebView
              /* keep testID if you also want it on Android, but wrapper ist primär */
              // testID="mainWebView"
              basicAuthCredential={basicAuthCredential}
              source={{ uri: serverUrl, headers }}
              injectedJavaScript={`
                try {
                  document.documentElement.style.setProperty("--safe-area-inset-top", "${insets.top}px");
                  document.documentElement.style.setProperty("--safe-area-inset-bottom", "${insets.bottom}px");
                  document.documentElement.style.setProperty("--safe-area-inset-left", "${insets.left}px");
                  document.documentElement.style.setProperty("--safe-area-inset-right", "${insets.right}px");
                } catch(e) {
                  // ignore
                }
              `}
              style={{ flex: 1 }}
              key={webViewKey}
              bounces={false}
              ref={(r) => {
                // keep ref usable in case native actions are required
                // @ts-ignore
                webViewRef.current = r;
              }}
              overScrollMode="never"
              setBuiltInZoomControls={false}
              applicationNameForUserAgent={USER_AGENT}
              onError={onError}
              onHttpError={onHttpError}
              onLoad={onLoad}
              onLoadStart={onLoadStart}
              onLoadEnd={onLoadEnd}
              onContentProcessDidTerminate={onTerminate}
              onMessage={handleMessage}
              onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
              onFileDownload={onFileDownload}
              onLoadProgress={onLoadProgress}
              startInLoadingState={true}
              renderLoading={() => <LoadingScreen />}
            />
          </View>
        </Animated.View>

        <Animated.View
          style={{
            ...styles.overlay,
            opacity: loadFade,
            transform: [{ scale: loadScale }],
          }}
          // Wenn nicht verbunden: overlay zeigt Lade-UI, aber erlaubt Touch-Events durch (box-none).
          pointerEvents={isConnected ? "none" : "box-none"}
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
      onLoadStart,
      onLoadEnd,
      onTerminate,
      handleMessage,
      onShouldStartLoadWithRequest,
      onLoadProgress,
      openSettings,
      insets,
      t,
    ],
  );

  if (!serverUrl) {
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
